<?php
include __DIR__ . '/config_planillas/config.php';

$term = $_GET['term'] ?? '';

$stmt = $conn->prepare("SELECT codigo_vehiculo FROM vehiculos WHERE codigo_vehiculo LIKE ? LIMIT 10");
$like = "%$term%";
$stmt->bind_param("s", $like);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while($row = $res->fetch_assoc()){
    $data[] = $row['codigo_vehiculo'];
}
$stmt->close();

echo json_encode($data);
