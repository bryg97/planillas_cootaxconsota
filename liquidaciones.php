<?php
ini_set('display_errors',1);
error_reporting(E_ALL);
session_start();
include __DIR__ . '/config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if(!isset($_SESSION['rol'])){ header("Location: login.php"); exit(); }

$rol=$_SESSION['rol'];
$usuario=$_SESSION['usuario'] ?? '';
$user_id=$_SESSION['id_usuario'] ?? 0;

/* =========================================================
   TELEGRAM
========================================================= */
$cfg=$conn->query("SELECT telegram_token, telegram_chatid FROM configuracion LIMIT 1")->fetch_assoc();
$telegram_token=$cfg['telegram_token'] ?? '';
$telegram_chatid=$cfg['telegram_chatid'] ?? '';

function enviarTelegram($token,$chat,$msg){
    if(!$token||!$chat) return;
    $ch=curl_init("https://api.telegram.org/bot$token/sendMessage");
    curl_setopt_array($ch,[
        CURLOPT_POST=>true,
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_POSTFIELDS=>[
            'chat_id'=>$chat,
            'text'=>$msg,
            'parse_mode'=>'Markdown'
        ]
    ]);
    curl_exec($ch); curl_close($ch);
}

/* =========================================================
   LIMPIEZA AUTOMÁTICA SEGURA
========================================================= */
// liquidaciones huérfanas
$conn->query("
DELETE l FROM liquidaciones l
LEFT JOIN planillas p ON l.planilla_id=p.id
WHERE p.id IS NULL
");

// liquidaciones ya historizadas
$conn->query("
DELETE l FROM liquidaciones l
INNER JOIN liquidaciones_historial h
    ON h.planilla_id=l.planilla_id
WHERE l.estado='pendiente'
");

/* =========================================================
   1️⃣ SOLICITAR LIQUIDACIÓN
========================================================= */
if(isset($_POST['solicitar']) && in_array($rol,['operador','admin'])){
    foreach($_POST['planilla_ids'] ?? [] as $pid){
        $pid=intval($pid);
        $conn->query("
            INSERT IGNORE INTO liquidaciones
            (planilla_id,operador_id,estado,created_at)
            SELECT id,$user_id,'pendiente',NOW()
            FROM planillas
            WHERE id=$pid AND tipo='efectivo'
              AND (pagada=0 OR pagada IS NULL)
        ");
    }
    header("Location: liquidaciones.php"); exit();
}

/* =========================================================
   FUNCIÓN DE APROBACIÓN BLINDADA
========================================================= */
function aprobarLiquidacion($liq_id,$conn,$usuario,$telegram_token,$telegram_chatid){

    $liq=$conn->query("
        SELECT * FROM liquidaciones
        WHERE id=$liq_id AND estado='pendiente'
        LIMIT 1
    ")->fetch_assoc();

    if(!$liq) return;

    $p=$conn->query("
        SELECT * FROM planillas
        WHERE id=".$liq['planilla_id']."
        LIMIT 1
    ")->fetch_assoc();

    if(!$p){
        $conn->query("DELETE FROM liquidaciones WHERE id=$liq_id");
        return;
    }

    /* reset saldos vehículo */
    $conn->query("
        UPDATE vehiculos
        SET saldo=0, saldo_pendiente=0
        WHERE id=".intval($p['vehiculo_id'])
    );

    /* mover planilla a historial (SIN id) */
    $colsRes=$conn->query("SHOW COLUMNS FROM planillas");
    $cols=[]; $vals=[];
    while($c=$colsRes->fetch_assoc()){
        $f=$c['Field'];
        if($f==='id') continue; // 🔒 NO copiar PK
        $cols[]="`$f`";
        $vals[] = isset($p[$f])
            ? "'".$conn->real_escape_string($p[$f])."'"
            : "NULL";
    }

    $conn->query("
        INSERT INTO planillas_historial(".implode(',',$cols).")
        VALUES(".implode(',',$vals).")
    ");

    $conn->query("DELETE FROM planillas WHERE id=".$p['id']);

    /* mover liquidación a historial (SIN id) */
    $conn->query("
        INSERT INTO liquidaciones_historial
        (planilla_id,operador_id,estado,fecha,created_at,liquidacion_origen_id)
        VALUES(
            ".$liq['planilla_id'].",
            ".$liq['operador_id'].",
            'aprobada',
            NOW(),
            '".$liq['created_at']."',
            ".$liq_id."
        )
    ");

    $conn->query("DELETE FROM liquidaciones WHERE id=$liq_id");

    /* telegram */
    if($telegram_token && $telegram_chatid){
        $msg ="✅ *LIQUIDACIÓN APROBADA*\n";
        $msg.="Planilla: *".$p['numero_planilla']."*\n";
        $msg.="Vehículo: *".$p['vehiculo_id']."*\n";
        $msg.="Valor: $".number_format($p['valor'],0,',','.')."\n";
        $msg.="🕒 ".date("d/m/Y h:i a");
        enviarTelegram($telegram_token,$telegram_chatid,$msg);
    }
}

/* =========================================================
   2️⃣ APROBACIONES
========================================================= */
if(isset($_POST['accion']) && in_array($rol,['tesorera','admin'])){

    if($_POST['accion']=='aprobada'){
        aprobarLiquidacion(intval($_POST['liq_id']),$conn,$usuario,$telegram_token,$telegram_chatid);
    }

    if($_POST['accion']=='aprobar_bloque'){
        foreach($_POST['liq_ids'] ?? [] as $id){
            aprobarLiquidacion(intval($id),$conn,$usuario,$telegram_token,$telegram_chatid);
        }
    }

    if($_POST['accion']=='aprobar_todas'){
        $rs=$conn->query("SELECT id FROM liquidaciones WHERE estado='pendiente'");
        while($r=$rs->fetch_assoc()){
            aprobarLiquidacion($r['id'],$conn,$usuario,$telegram_token,$telegram_chatid);
        }
    }

    header("Location: liquidaciones.php"); exit();
}

/* =========================================================
   CONSULTAS
========================================================= */
$planillas=$conn->query("
SELECT p.*,v.codigo_vehiculo,
(SELECT COUNT(*) FROM liquidaciones l
 WHERE l.planilla_id=p.id AND l.estado='pendiente') solicitada
FROM planillas p
JOIN vehiculos v ON p.vehiculo_id=v.id
WHERE p.tipo='efectivo' AND (p.pagada=0 OR p.pagada IS NULL)
ORDER BY p.fecha DESC
");

$liq=$conn->query("
SELECT l.*,u.usuario operador,p.numero_planilla,p.valor,v.codigo_vehiculo
FROM liquidaciones l
JOIN usuarios u ON l.operador_id=u.id
JOIN planillas p ON l.planilla_id=p.id
JOIN vehiculos v ON p.vehiculo_id=v.id
WHERE l.estado='pendiente'
ORDER BY l.created_at ASC
");

/* agrupar solo visual */
$bloques=[];
while($r=$liq->fetch_assoc()){
    $f=date('d/m/Y',strtotime($r['created_at']));
    $bloques[$f][]=$r;
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Liquidaciones</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">

<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>

<h4>1️⃣ Solicitar liquidación</h4>
<?php if(in_array($rol,['operador','admin'])): ?>
<form method="POST">
<input type="hidden" name="solicitar" value="1">
<table class="table table-sm table-striped">
<thead>
<tr>
<th><input type="checkbox" id="checkAll"></th>
<th>Fecha</th><th>Vehículo</th><th>N°</th><th>Valor</th>
</tr>
</thead>
<tbody>
<?php while($p=$planillas->fetch_assoc()): ?>
<tr>
<td><?=intval($p['solicitada'])?'<input type="checkbox" disabled>':'<input type="checkbox" name="planilla_ids[]" value="'.$p['id'].'">'?></td>
<td><?=date("d/m/Y",strtotime($p['fecha']))?></td>
<td><?=$p['codigo_vehiculo']?></td>
<td><?=$p['numero_planilla']?></td>
<td><?=number_format($p['valor'],0,',','.')?></td>
</tr>
<?php endwhile; ?>
</tbody>
</table>
<button class="btn btn-primary">Solicitar</button>
</form>
<?php endif; ?>

<hr>

<h4>2️⃣ Solicitudes pendientes</h4>

<?php foreach($bloques as $fecha=>$items): ?>
<div class="card mb-3">
<div class="card-header d-flex justify-content-between">
<div>📅 <?=$fecha?> | 📄 <?=count($items)?></div>
<?php if(in_array($rol,['tesorera','admin'])): ?>
<form method="POST">
<input type="hidden" name="accion" value="aprobar_bloque">
<?php foreach($items as $i): ?>
<input type="hidden" name="liq_ids[]" value="<?=$i['id']?>">
<?php endforeach; ?>
<button class="btn btn-sm btn-success">Aprobar bloque</button>
</form>
<?php endif; ?>
</div>
<div class="card-body">
<table class="table table-sm">
<?php foreach($items as $i): ?>
<tr>
<td><?=$i['numero_planilla']?></td>
<td><?=$i['codigo_vehiculo']?></td>
<td><?=number_format($i['valor'],0,',','.')?></td>
<td><?=$i['operador']?></td>
<td>
<?php if(in_array($rol,['tesorera','admin'])): ?>
<form method="POST">
<input type="hidden" name="accion" value="aprobada">
<input type="hidden" name="liq_id" value="<?=$i['id']?>">
<button class="btn btn-sm btn-success">Aprobar</button>
</form>
<?php endif; ?>
</td>
</tr>
<?php endforeach; ?>
</table>
</div>
</div>
<?php endforeach; ?>

<script>
document.getElementById('checkAll')?.addEventListener('change',e=>{
document.querySelectorAll('input[name="planilla_ids[]"]').forEach(c=>c.checked=e.target.checked);
});
</script>

</body>
</html>
