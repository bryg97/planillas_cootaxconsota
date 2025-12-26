<?php
// verificar_deuda.php — devuelve planillas crédito pendientes por vehículo
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json; charset=utf-8');

include __DIR__ . '/config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if (!isset($_SESSION['rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

$veh_id = intval($_GET['veh_id'] ?? 0);
if ($veh_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Vehículo inválido']);
    exit;
}

// obtener planillas pendientes
$sql = "SELECT 
            id,
            DATE_FORMAT(fecha,'%Y-%m-%d %H:%i:%s') AS fecha,
            numero_planilla,
            conductor,
            valor
        FROM planillas
        WHERE vehiculo_id = $veh_id 
          AND tipo = 'credito'
          AND (pagada = 0 OR pagada IS NULL)
        ORDER BY fecha ASC";

$res = $conn->query($sql);

$planillas = [];
$total = 0;

while ($r = $res->fetch_assoc()) {
    $r['valor_fmt'] = number_format($r['valor'], 0, ',', '.');
    $total += $r['valor'];
    $planillas[] = $r;
}

echo json_encode([
    'success'    => true,
    'planillas'  => $planillas,
    'total'      => $total
]);
