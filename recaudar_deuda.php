<?php
// recaudar_deuda.php — recauda todas las planillas crédito pendientes del vehículo
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

$rol     = $_SESSION['rol'];
$usuario = $_SESSION['usuario'] ?? '';
$user_id = $_SESSION['id_usuario'] ?? null;

if (!in_array($rol, ['operador', 'admin'])) {
    echo json_encode(['success' => false, 'error' => 'Sin permisos']);
    exit;
}

$veh_id = intval($_POST['veh_id'] ?? 0);
if ($veh_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Vehículo inválido']);
    exit;
}

$conn->begin_transaction();

try {

    // bloquear fila vehículo
    $veh = $conn->query("SELECT id, codigo_vehiculo, saldo, saldo_pendiente 
                         FROM vehiculos 
                         WHERE id=$veh_id 
                         FOR UPDATE")->fetch_assoc();

    if (!$veh) throw new Exception("Vehículo no encontrado.");

    $codigo         = $veh['codigo_vehiculo'];
    $saldo_actual   = floatval($veh['saldo']);
    $saldo_pendiente= floatval($veh['saldo_pendiente']);

    // obtener planillas crédito pendientes
    $res = $conn->query("SELECT id, valor, numero_planilla, conductor
                         FROM planillas
                         WHERE vehiculo_id=$veh_id
                           AND tipo='credito'
                           AND (pagada=0 OR pagada IS NULL)");

    $planillas = [];
    $total = 0;

    while ($p = $res->fetch_assoc()) {
        $planillas[] = $p;
        $total += floatval($p['valor']);
    }

    if (empty($planillas)) {
        echo json_encode(['success' => false, 'error' => 'No hay planillas pendientes']);
        exit;
    }

    // convertir a efectivo + liquidaciones
    foreach ($planillas as $p) {

        $pid = intval($p['id']);

        // convertir planilla a efectivo
        $conn->query("UPDATE planillas 
                      SET tipo='efectivo', pagada=0 
                      WHERE id=$pid");

        // generar liquidación si no existe
        $conn->query("INSERT IGNORE INTO liquidaciones (planilla_id, operador_id, estado, created_at)
                      VALUES ($pid, $user_id, 'pendiente', NOW())");
    }

    // actualiza saldos
    $nuevo_saldo           = $saldo_actual + $total;
    $nuevo_saldo_pendiente = $saldo_pendiente + $total;

    $conn->query("UPDATE vehiculos 
                  SET saldo=$nuevo_saldo, saldo_pendiente=$nuevo_saldo_pendiente
                  WHERE id=$veh_id");

    // auditoría
    $detalle = "Recaudo de deuda del vehiculo $codigo total $" . number_format($total, 0, ',', '.') . " por $usuario";
    $conn->query("INSERT INTO auditoria (usuario, accion, detalles)
                  VALUES ('".$conn->real_escape_string($usuario)."','Recaudo deuda','".$conn->real_escape_string($detalle)."')");

    // telegram
    $cfg = $conn->query("SELECT telegram_token, telegram_chatid FROM configuracion LIMIT 1")->fetch_assoc();
    $telegram_token = $cfg['telegram_token'];
    $telegram_chatid = $cfg['telegram_chatid'];

    if ($telegram_token && $telegram_chatid) {

        $fecha_msg = date("d/m/Y h:i a");
        $msg = "💵 *RECAUDO DE DEUDA*\n";
        $msg .= "👤 Recaudó: *$usuario*\n";
        $msg .= "🚖 Vehículo: *$codigo*\n\n";
        $msg .= "Planillas convertidas:\n";

        foreach ($planillas as $p) {
            $msg .= "- N° ".$p['numero_planilla']." → $".number_format($p['valor'],0,',','.')."\n";
        }

        $msg .= "\n*TOTAL:* $".number_format($total,0,',','.');
        $msg .= "\n🕒 $fecha_msg";

        $ch = curl_init("https://api.telegram.org/bot$telegram_token/sendMessage");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            'chat_id'    => $telegram_chatid,
            'text'       => $msg,
            'parse_mode' => 'Markdown'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }

    $conn->commit();

    echo json_encode(['success' => true, 'total' => $total]);

} catch (Exception $e) {

    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);

}
