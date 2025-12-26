<?php
include __DIR__ . '/config_planillas/config.php';
header('Content-Type: application/json');

$vehiculo_id = intval($_POST['vehiculo_id'] ?? 0);
$respuesta = ['deuda_hoy' => false, 'deuda_antigua' => false];

if($vehiculo_id > 0){
    $hoy = date('Y-m-d');
    $ayer = date('Y-m-d', strtotime('-1 day'));

    // Planillas sin pagar hoy
    $sql_hoy = "SELECT COUNT(*) AS c FROM planillas WHERE vehiculo_id = $vehiculo_id AND pagada = 0 AND DATE(fecha) = '$hoy'";
    $r_hoy = $conn->query($sql_hoy)->fetch_assoc();
    if(intval($r_hoy['c']) > 0){
        $respuesta['deuda_hoy'] = true;
    }

    // Planillas sin pagar >= 2 días
    $sql_antigua = "SELECT COUNT(*) AS c FROM planillas WHERE vehiculo_id = $vehiculo_id AND pagada = 0 AND DATE(fecha) <= '$ayer'";
    $r_antigua = $conn->query($sql_antigua)->fetch_assoc();
    if(intval($r_antigua['c']) > 0){
        $respuesta['deuda_antigua'] = true;
    }
}

echo json_encode($respuesta);
