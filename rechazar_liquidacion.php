<?php
// rechazar_liquidacion.php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
ob_clean();

session_start();
include __DIR__ . '/../../config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if (!isset($_SESSION['rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

$rol = $_SESSION['rol'];
$usuario = $_SESSION['usuario'] ?? '';

if (!in_array($rol, ['tesorera', 'admin'])) {
    echo json_encode(['success' => false, 'error' => 'Sin permisos']);
    exit;
}

$liq_id = intval($_POST['liq_id'] ?? 0);
if ($liq_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID inválido']);
    exit;
}

$conn->begin_transaction();
try {
    $liq = $conn->query("SELECT * FROM liquidaciones WHERE id=$liq_id FOR UPDATE")->fetch_assoc();
    if (!$liq) throw new Exception("Liquidación no encontrada.");

    $planilla_id = intval($liq['planilla_id']);
    $p = $conn->query("SELECT * FROM planillas WHERE id=$planilla_id")->fetch_assoc();
    if (!$p) throw new Exception("Planilla no encontrada.");

    $veh_id = intval($p['vehiculo_id']);
    $veh = $conn->query("SELECT codigo_vehiculo, saldo_pendiente FROM vehiculos WHERE id=$veh_id FOR UPDATE")->fetch_assoc();
    $valor = floatval($p['valor']);

    // revertir tipo a crédito
    $conn->query("UPDATE planillas SET tipo='credito', pagada=0 WHERE id=$planilla_id");

    // eliminar liquidación
    $conn->query("DELETE FROM liquidaciones WHERE id=$liq_id");

    // restar saldo_pendiente temporal (si existía)
    $nuevo_pendiente = floatval($veh['saldo_pendiente']) - $valor;
    if ($nuevo_pendiente < 0) $nuevo_pendiente = 0;
    $conn->query("UPDATE vehiculos SET saldo_pendiente=$nuevo_pendiente WHERE id=$veh_id");

    // auditoría
    $conn->query("INSERT INTO auditoria (usuario, accion, detalles)
                  VALUES ('".$conn->real_escape_string($usuario)."','Liquidación rechazada',
                          'Planilla $planilla_id de vehiculo ".$veh['codigo_vehiculo']." revertida a crédito')");

    // Telegram
    $cfg = $conn->query("SELECT telegram_token, telegram_chatid FROM configuracion LIMIT 1")->fetch_assoc();
    $telegram_token = $cfg['telegram_token'] ?? '';
    $telegram_chatid = $cfg['telegram_chatid'] ?? '';

    if (!empty($telegram_token) && !empty($telegram_chatid)) {
        $fecha_msg = date("d/m/Y h:i a");
        $msg = "🚫 *LIQUIDACIÓN RECHAZADA*\n";
        $msg .= "👤 Autorizó: *$usuario*\n";
        $msg .= "🚖 Vehículo: *".$veh['codigo_vehiculo']."*\n";
        $msg .= "📄 Planilla N°: *".$p['numero_planilla']."*\n";
        $msg .= "🕒 $fecha_msg";
        $ch = curl_init("https://api.telegram.org/bot$telegram_token/sendMessage");
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => [
                'chat_id' => $telegram_chatid,
                'text' => $msg,
                'parse_mode' => 'Markdown'
            ]
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Liquidación rechazada correctamente.']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
