<?php
include __DIR__ . '/config_planillas/config.php';
if(!isset($_POST['vehiculo_id'], $_POST['saldo'])) exit('error');
$vehiculo_id = intval($_POST['vehiculo_id']);
$saldo = floatval($_POST['saldo']);
$stmt = $conn->prepare("UPDATE vehiculos SET saldo=? WHERE id=?");
$stmt->bind_param("di",$saldo,$vehiculo_id);
if($stmt->execute()) echo 'ok';
else echo 'error';
?>
