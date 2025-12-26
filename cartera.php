<?php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

session_start();
include __DIR__ . '/../../config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if(!isset($_SESSION['rol'])){ header("Location: login.php"); exit(); }

$rol     = $_SESSION['rol'];
$usuario = $_SESSION['usuario'] ?? '';

// ================= CSRF =================
if(!isset($_SESSION['csrf_token'])){
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrf_token = $_SESSION['csrf_token'];

// ================= MENSAJES =================
$ok=''; $error='';
if(isset($_SESSION['ok'])){ $ok=$_SESSION['ok']; unset($_SESSION['ok']); }
if(isset($_SESSION['error'])){ $error=$_SESSION['error']; unset($_SESSION['error']); }

// ================= ESTRUCTURA =================
$conn->query("ALTER TABLE planillas ADD COLUMN IF NOT EXISTS pagada TINYINT(1) DEFAULT 0");


// ===================================================
// ========== TRAER PLANILLA DESDE REPORTES ==========
// ===================================================
if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['importar_planilla'])){

    if(!hash_equals($csrf_token,$_POST['csrf_token'] ?? '')){
        $_SESSION['error']="Token inválido";
        header("Location: cartera.php"); exit;
    }

    $veh_id = intval($_POST['veh_id']);
    $num    = $conn->real_escape_string($_POST['numero_planilla']);

    // ¿ya existe pendiente?
    $ex = $conn->query("SELECT id FROM planillas WHERE numero_planilla='$num' AND tipo='credito' LIMIT 1");
    if($ex->num_rows){
        $_SESSION['error']="La planilla ya está pendiente en cartera";
        header("Location: cartera.php"); exit;
    }

    // buscar en historial (reportes)
    $h = $conn->query("
        SELECT * FROM planillas_historial 
        WHERE numero_planilla='$num'
        LIMIT 1
    ")->fetch_assoc();

    if(!$h){
        $_SESSION['error']="No se encontró la planilla en reportes";
        header("Location: cartera.php"); exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO planillas
        (vehiculo_id, numero_planilla, conductor, valor, tipo, fecha, pagada)
        VALUES (?,?,?,?, 'credito', NOW(), 0)
    ");
    $stmt->bind_param(
        "issd",
        $veh_id,
        $h['numero_planilla'],
        $h['conductor'],
        $h['valor']
    );
    $stmt->execute();
    $stmt->close();

    $_SESSION['ok']="Planilla {$num} traída desde reportes y registrada en cartera";
    header("Location: cartera.php"); exit;
}


// ===================================================
// =============== PAGO UNA PLANILLA =================
// ===================================================
if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['pagar_una']) && in_array($rol,['tesorera','admin'])){

    if(!hash_equals($csrf_token,$_POST['csrf_token'] ?? '')){
        $_SESSION['error']="Token inválido";
        header("Location: cartera.php"); exit;
    }

    $planilla_id=intval($_POST['planilla_id']);
    $conn->begin_transaction();

    try{
        $p=$conn->query("
            SELECT * FROM planillas 
            WHERE id=$planilla_id 
              AND tipo='credito' 
              AND (pagada=0 OR pagada IS NULL)
        ")->fetch_assoc();

        if(!$p) throw new Exception("Planilla no encontrada");

        $veh=$conn->query("
            SELECT saldo, codigo_vehiculo 
            FROM vehiculos 
            WHERE id={$p['vehiculo_id']} FOR UPDATE
        ")->fetch_assoc();

        $nuevo_saldo = $veh['saldo'] + $p['valor'];

        // historial
        $cols=[]; $cr=$conn->query("SHOW COLUMNS FROM planillas");
        while($c=$cr->fetch_assoc()) $cols[]=$c['Field'];
        $cl=implode(",",array_map(fn($c)=>"`$c`",$cols));
        $vals=[];
        foreach($cols as $c){
            $vals[]=isset($p[$c])?"'".$conn->real_escape_string($p[$c])."'":"NULL";
        }
        $conn->query("INSERT INTO planillas_historial ($cl) VALUES (".implode(",",$vals).")");

        $conn->query("DELETE FROM planillas WHERE id=$planilla_id");

        $stmt=$conn->prepare("UPDATE vehiculos SET saldo=? WHERE id=?");
        $stmt->bind_param("di",$nuevo_saldo,$p['vehiculo_id']);
        $stmt->execute(); $stmt->close();

        $conn->commit();
        $_SESSION['ok']="Planilla {$p['numero_planilla']} pagada correctamente";
        header("Location: cartera.php"); exit;

    }catch(Exception $e){
        $conn->rollback();
        $_SESSION['error']="ERROR: ".$e->getMessage();
        header("Location: cartera.php"); exit;
    }
}


// ================= LISTADO VEHÍCULOS =================
$res=$conn->query("
    SELECT v.id veh_id, v.codigo_vehiculo,
           SUM(p.valor) total, COUNT(p.id) n
    FROM planillas p
    JOIN vehiculos v ON p.vehiculo_id=v.id
    WHERE p.tipo='credito' AND (p.pagada=0 OR p.pagada IS NULL)
    GROUP BY v.id
");
$veh=[]; while($r=$res->fetch_assoc()) $veh[]=$r;
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cartera</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">

<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Cartera – Créditos pendientes</h3>

<?php if($ok): ?><div class="alert alert-success"><?=$ok?></div><?php endif;?>
<?php if($error): ?><div class="alert alert-danger"><?=$error?></div><?php endif;?>

<table class="table table-striped">
<thead>
<tr><th>Vehículo</th><th>#</th><th>Total</th><th>Acción</th></tr>
</thead>
<tbody>
<?php foreach($veh as $v): ?>
<tr>
<td><?=$v['codigo_vehiculo']?></td>
<td><?=$v['n']?></td>
<td>$<?=number_format($v['total'],0,',','.')?></td>
<td>
<button class="btn btn-sm btn-outline-primary"
 data-bs-toggle="modal"
 data-bs-target="#det<?=$v['veh_id']?>">🔍 Ver detalle</button>
</td>
</tr>
<?php endforeach;?>
</tbody>
</table>

<?php foreach($veh as $v):
$vid=$v['veh_id'];
$det=$conn->query("SELECT * FROM planillas WHERE vehiculo_id=$vid AND tipo='credito'");
?>
<div class="modal fade" id="det<?=$vid?>">
<div class="modal-dialog modal-lg"><div class="modal-content">
<div class="modal-header">
<h5 class="modal-title">Detalle – <?=$v['codigo_vehiculo']?></h5>
<button class="btn-close" data-bs-dismiss="modal"></button>
</div>
<div class="modal-body">

<table class="table table-sm">
<thead><tr><th>N°</th><th>Conductor</th><th>Valor</th><th></th></tr></thead>
<tbody>
<?php while($d=$det->fetch_assoc()): ?>
<tr>
<td><?=$d['numero_planilla']?></td>
<td><?=$d['conductor']?></td>
<td>$<?=number_format($d['valor'],0,',','.')?></td>
<td>
<form method="POST">
<input type="hidden" name="pagar_una" value="1">
<input type="hidden" name="planilla_id" value="<?=$d['id']?>">
<input type="hidden" name="csrf_token" value="<?=$csrf_token?>">
<button class="btn btn-sm btn-success">Pagar</button>
</form>
</td>
</tr>
<?php endwhile;?>
</tbody>
</table>

<hr>

<h6>➕ Traer planilla desde reportes</h6>
<form method="POST" class="row g-2">
<input type="hidden" name="importar_planilla" value="1">
<input type="hidden" name="veh_id" value="<?=$vid?>">
<input type="hidden" name="csrf_token" value="<?=$csrf_token?>">
<div class="col-md-6">
<input name="numero_planilla" class="form-control" placeholder="N° planilla" required>
</div>
<div class="col-md-6">
<button class="btn btn-primary w-100">Importar</button>
</div>
</form>

</div>
</div></div>
</div>
<?php endforeach;?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
