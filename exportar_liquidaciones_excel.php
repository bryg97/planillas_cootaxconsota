<?php
session_start();
include 'config.php';

if(!isset($_SESSION['rol']) || !in_array($_SESSION['rol'], ['admin', 'tesorera'])){
    header("Location: login.php");
    exit();
}

header("Content-Type: application/vnd.ms-excel");
header("Content-Disposition: attachment; filename=liquidaciones_" . date("Y-m-d") . ".xls");
header("Pragma: no-cache");
header("Expires: 0");

$sql = "
SELECT l.id AS id_liq, l.estado, l.fecha_solicitud, l.fecha_respuesta,
       p.numero_planilla, p.valor, p.tipo, v.codigo_vehiculo,
       u.usuario AS operador
FROM liquidaciones l
INNER JOIN planillas p ON l.planilla_id=p.id
INNER JOIN vehiculos v ON p.vehiculo_id=v.id
INNER JOIN usuarios u ON l.operador_id=u.id
ORDER BY l.fecha_solicitud DESC
";
$result = $conn->query($sql);

echo "<table border='1'>";
echo "<tr>
<th>ID</th>
<th>N° Planilla</th>
<th>Vehículo</th>
<th>Tipo</th>
<th>Valor</th>
<th>Operador</th>
<th>Estado</th>
<th>Fecha Solicitud</th>
<th>Fecha Respuesta</th>
</tr>";

while($row = $result->fetch_assoc()){
    echo "<tr>
    <td>{$row['id_liq']}</td>
    <td>{$row['numero_planilla']}</td>
    <td>{$row['codigo_vehiculo']}</td>
    <td>{$row['tipo']}</td>
    <td>{$row['valor']}</td>
    <td>{$row['operador']}</td>
    <td>{$row['estado']}</td>
    <td>{$row['fecha_solicitud']}</td>
    <td>{$row['fecha_respuesta']}</td>
    </tr>";
}
echo "</table>";
exit;
?>
