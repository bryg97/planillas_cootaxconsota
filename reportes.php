<?php
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include __DIR__ . '/config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if(!isset($_SESSION['rol'])){ header("Location: login.php"); exit(); }

$f1=$_GET['f1']??'';
$f2=$_GET['f2']??'';
$veh=$_GET['veh']??'';
$usuario=$_GET['usuario']??'';
$tipo=$_GET['tipo']??'';
$estado=$_GET['estado']??''; // <-- NUEVO

// 1) planillas actuales (pendientes)
$Q1="SELECT fecha, numero_planilla, v.codigo_vehiculo, conductor, u.usuario operador, tipo, valor, pagada, 'p' as origen
FROM planillas p
LEFT JOIN vehiculos v ON p.vehiculo_id=v.id
LEFT JOIN usuarios u ON p.operador_id=u.id
WHERE 1=1";

// 2) liquidadas (historial)
$Q2="SELECT fecha, numero_planilla, v.codigo_vehiculo, conductor, u.usuario operador, tipo, valor, pagada, 'h' as origen
FROM planillas_historial p
LEFT JOIN vehiculos v ON p.vehiculo_id=v.id
LEFT JOIN usuarios u ON p.operador_id=u.id
WHERE 1=1";

$filter="";
if($f1 && $f2) $filter.=" AND DATE(fecha) BETWEEN '$f1' AND '$f2'";
if($veh) $filter.=" AND v.codigo_vehiculo='$veh'";
if($usuario) $filter.=" AND u.usuario='$usuario'";
if($tipo) $filter.=" AND tipo='$tipo'";

// --- FILTRO POR ESTADO ---
if($estado == 'pendiente'){
    // Solo planillas actuales
    $Q2 = ""; // no incluir historial
} elseif($estado == 'liquidada'){
    // Solo historial
    $Q1 = ""; // no incluir planillas pendientes
}

if($Q1) $Q1.=$filter;
if($Q2) $Q2.=$filter;

if($Q1 && $Q2){
    $q="$Q1 UNION ALL $Q2 ORDER BY fecha DESC";
} else {
    $q=($Q1 ?: $Q2) . " ORDER BY fecha DESC";
}

$res=$conn->query($q);
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reportes</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Reportes de Planillas (Todas)</h3>

<form method="GET" class="row g-2 mb-3">
    <div class="col-md-2"><label>Desde</label><input type="date" name="f1" class="form-control" value="<?=$f1?>"></div>
    <div class="col-md-2"><label>Hasta</label><input type="date" name="f2" class="form-control" value="<?=$f2?>"></div>
    <div class="col-md-2"><label>Vehículo</label><input name="veh" class="form-control" value="<?=$veh?>"></div>
    <div class="col-md-2"><label>Usuario</label><input name="usuario" class="form-control" value="<?=$usuario?>"></div>
    <div class="col-md-2">
        <label>Tipo</label>
        <select name="tipo" class="form-select">
            <option value="">Todos</option>
            <option value="credito" <?= $tipo=='credito'?'selected':'' ?>>Crédito</option>
            <option value="efectivo" <?= $tipo=='efectivo'?'selected':'' ?>>Efectivo</option>
        </select>
    </div>
    <div class="col-md-2">
        <label>Estado</label>
        <select name="estado" class="form-select">
            <option value="">Todos</option>
            <option value="pendiente" <?= $estado=='pendiente'?'selected':'' ?>>Pendiente</option>
            <option value="liquidada" <?= $estado=='liquidada'?'selected':'' ?>>Liquidada</option>
        </select>
    </div>
    <div class="col-md-2 d-flex align-items-end">
        <button class="btn btn-primary w-100">Filtrar</button>
    </div>
</form>

<div class="mb-3">
    <button class="btn btn-success" onclick="exportTableToExcel('tablaPlanillas','planillas')">Exportar a Excel</button>
    <button class="btn btn-info" onclick="printTable('tablaPlanillas')">Imprimir</button>
</div>

<table class="table table-striped table-sm" id="tablaPlanillas">
<thead>
<tr>
<th>Fecha</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Operador</th>
<th>N° Planilla</th>
<th>Tipo</th>
<th>Valor</th>
<th>Estado</th>
</tr>
</thead>
<tbody>
<?php
$total=0;
while($r=$res->fetch_assoc()):
$total+=$r['valor'];
?>
<tr>
<td><?=date("d/m/Y h:i a", strtotime($r['fecha']))?></td>
<td><?=$r['codigo_vehiculo']?></td>
<td><?=$r['conductor']?></td>
<td><?=$r['operador']?></td>
<td><?=$r['numero_planilla']?></td>
<td><?=$r['tipo']?></td>
<td><?=number_format($r['valor'],0,',','.')?></td>
<td><?=($r['origen']=='p'?'PENDIENTE':'LIQUIDADA')?></td>
</tr>
<?php endwhile; ?>
<tr class="table-secondary">
<td colspan="7" class="text-end fw-bold">Total:</td>
<td class="fw-bold"><?=number_format($total,0,',','.')?></td>
</tr>
</tbody>
</table>

<script>
// Exportar a Excel
function exportTableToExcel(tableID, filename = ''){
    var table = document.getElementById(tableID);
    var html = table.outerHTML.replace(/ /g, '%20');
    filename = filename?filename+'.xls':'planillas.xls';
    var a = document.createElement('a');
    a.href = 'data:application/vnd.ms-excel,' + html;
    a.download = filename;
    a.click();
}

// Imprimir tabla
function printTable(tableID){
    var table = document.getElementById(tableID).outerHTML;
    var ventana = window.open('', '', 'width=900,height=700');
    ventana.document.write('<html><head><title>Imprimir</title>');
    ventana.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    ventana.document.write('<style>body{padding:20px;} table{width:100%;}</style>');
    ventana.document.write('</head><body>');
    ventana.document.write('<h3>Reportes de Planillas</h3>');
    ventana.document.write(table);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.onload = function(){
        ventana.focus();
        ventana.print();
    };
}
</script>

</body>
</html>
