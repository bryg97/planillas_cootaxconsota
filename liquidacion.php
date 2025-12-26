<?php
// liquidaciones.php — unificado: solicitud, revisión y aprobación
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);
session_start();
include __DIR__ . '/config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if(!isset($_SESSION['rol'])) { header("Location: login.php"); exit(); }

$rol = $_SESSION['rol'];
$usuario = $_SESSION['usuario'] ?? '';
$user_id = $_SESSION['id_usuario'] ?? null;

// Obtener telegram config
$cfg = $conn->query("SELECT telegram_token, telegram_chatid FROM configuracion LIMIT 1")->fetch_assoc();
$telegram_token = $cfg['telegram_token'] ?? '';
$telegram_chatid = $cfg['telegram_chatid'] ?? '';

function enviarTelegram($token, $chatid, $texto){
    if(empty($token) || empty($chatid)) return false;
    $ch = curl_init("https://api.telegram.org/bot$token/sendMessage");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'chat_id' => $chatid,
        'text' => $texto,
        'parse_mode' => 'Markdown'
    ]);
    curl_exec($ch);
    curl_close($ch);
}

$ok=''; $error='';

// -------------------------------------------------------------------------
// 1️⃣ SOLICITUD DE LIQUIDACIÓN (solo efectivo)
if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['solicitar']) && in_array($rol,['operador','admin'])){
    $ids = $_POST['planilla_ids'] ?? [];
    if(!is_array($ids) || count($ids)===0){
        $error="No seleccionaste planillas.";
    } else {
        $conn->begin_transaction();
        try {
            foreach($ids as $pid){
                $pid=intval($pid);
                $p=$conn->query("SELECT id,tipo,pagada FROM planillas WHERE id=$pid LIMIT 1")->fetch_assoc();
                if(!$p) continue;
                if($p['tipo']!=='efectivo' || intval($p['pagada'])===1) continue;
                $conn->query("INSERT IGNORE INTO liquidaciones(planilla_id,operador_id,estado,created_at) VALUES($pid,$user_id,'pendiente',NOW())");
            }
            $conn->query("INSERT INTO auditoria(usuario,accion,detalles) VALUES('".$conn->real_escape_string($usuario)."','Solicitud liquidación','Se solicitó liquidación de planillas efectivo.')");
            $conn->commit();
            $ok="Solicitud enviada correctamente.";
        } catch(Exception $e){
            $conn->rollback(); $error="Error: ".$e->getMessage();
        }
    }
    header("Location: liquidaciones.php"); exit();
}

// -------------------------------------------------------------------------
// 2️⃣ APROBAR / RECHAZAR / APROBAR TODAS
if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['accion']) && in_array($rol,['tesorera','admin'])){
    $accion=$_POST['accion'];

    // Aprobar una
    if($accion==='aprobada'){
        $liq_id=intval($_POST['liq_id']);
        $liq=$conn->query("SELECT * FROM liquidaciones WHERE id=$liq_id")->fetch_assoc();
        if($liq){
            $conn->begin_transaction();
            try{
                $planilla_id=intval($liq['planilla_id']);
                $p=$conn->query("SELECT * FROM planillas WHERE id=$planilla_id")->fetch_assoc();
                if($p){
                    $veh_id=intval($p['vehiculo_id']);
                    $v=$conn->query("SELECT id,codigo_vehiculo,saldo,saldo_pendiente FROM vehiculos WHERE id=$veh_id FOR UPDATE")->fetch_assoc();
                    $valor=floatval($p['valor']);
                    $nuevo_saldo=0; $nuevo_pendiente=0;

                    // Ajuste saldos → deja ambos en 0
                    $conn->query("UPDATE vehiculos SET saldo=$nuevo_saldo, saldo_pendiente=$nuevo_pendiente WHERE id=$veh_id");

                    // mover planilla al historial
                    $colsRes=$conn->query("SHOW COLUMNS FROM planillas");
                    $cols=[]; while($c=$colsRes->fetch_assoc()) $cols[]="`".$c['Field']."`";
                    $cols_list=implode(",",$cols);
                    $vals=[]; foreach($cols as $col){
                        $campo=str_replace("`","",$col);
                        $vals[] = isset($p[$campo]) ? "'".$conn->real_escape_string($p[$campo])."'" : "NULL";
                    }
                    $vals_list=implode(",",$vals);
                    $conn->query("INSERT INTO planillas_historial ($cols_list) VALUES ($vals_list)");
                    $conn->query("DELETE FROM planillas WHERE id=$planilla_id");

                    // mover liquidacion al historial
                    $conn->query("INSERT INTO liquidaciones_historial (planilla_id,operador_id,estado,fecha,created_at)
                                  SELECT planilla_id,operador_id,'aprobada',NOW(),created_at FROM liquidaciones WHERE id=$liq_id");
                    $conn->query("DELETE FROM liquidaciones WHERE id=$liq_id");
                }
                // telegram
                if(!empty($telegram_token) && !empty($telegram_chatid)){
                    $fecha_msg=date("d/m/Y h:i a");
                    $msg="✅ *LIQUIDACIÓN APROBADA*\n";
                    $msg.="👤 Solicitó: *".$usuario."*\n";
                    $msg.="👤 Autorizó: *".$usuario."*\n\n";
                    $msg.="Planillas:\n- N°".$p['numero_planilla']." → $".number_format($p['valor'],0,',','.')."\n\n";
                    $msg.="*TOTAL:* $".number_format($p['valor'],0,',','.')."\n🕒 ".$fecha_msg;
                    enviarTelegram($telegram_token,$telegram_chatid,$msg);
                }
                $conn->commit(); $ok="Liquidación aprobada.";
            }catch(Exception $e){$conn->rollback();$error="Error: ".$e->getMessage();}
        }
    }

    // Aprobar todas
    if($accion==='aprobar_todas'){
        $conn->begin_transaction();
        try{
            $rs=$conn->query("SELECT l.id liq_id,p.*,v.codigo_vehiculo,v.saldo,v.saldo_pendiente FROM liquidaciones l JOIN planillas p ON l.planilla_id=p.id JOIN vehiculos v ON p.vehiculo_id=v.id WHERE l.estado='pendiente' AND p.tipo='efectivo'");
            $total=0; $detalles=[];
            while($r=$rs->fetch_assoc()){
                $total+=floatval($r['valor']);
                $veh_id=intval($r['vehiculo_id']);
                // reset saldos
                $conn->query("UPDATE vehiculos SET saldo=0, saldo_pendiente=0 WHERE id=$veh_id");

                // historial planilla
                $colsRes=$conn->query("SHOW COLUMNS FROM planillas");
                $cols=[]; while($c=$colsRes->fetch_assoc()) $cols[]="`".$c['Field']."`";
                $cols_list=implode(",",$cols);
                $vals=[]; foreach($cols as $col){
                    $campo=str_replace("`","",$col);
                    $vals[] = isset($r[$campo]) ? "'".$conn->real_escape_string($r[$campo])."'" : "NULL";
                }
                $vals_list=implode(",",$vals);
                $conn->query("INSERT INTO planillas_historial ($cols_list) VALUES ($vals_list)");
                $conn->query("DELETE FROM planillas WHERE id=".intval($r['id']));
                $conn->query("INSERT INTO liquidaciones_historial (planilla_id,operador_id,estado,fecha,created_at)
                              SELECT planilla_id,operador_id,'aprobada',NOW(),created_at FROM liquidaciones WHERE id=".intval($r['liq_id']));
                $conn->query("DELETE FROM liquidaciones WHERE id=".intval($r['liq_id']));
                $detalles[]="- ".$r['codigo_vehiculo']." N°".$r['numero_planilla']." → $".number_format($r['valor'],0,',','.');
            }
            if(!empty($telegram_token) && !empty($telegram_chatid) && count($detalles)>0){
                $fecha_msg=date("d/m/Y h:i a");
                $msg="✅ *LIQUIDACIÓN APROBADA*\n";
                $msg.="👤 Solicitó: *Operadores*\n";
                $msg.="👤 Autorizó: *".$usuario."*\n\n";
                $msg.="Planillas:\n".implode("\n",$detalles)."\n\n";
                $msg.="*TOTAL:* $".number_format($total,0,',','.')."\n🕒 ".$fecha_msg;
                enviarTelegram($telegram_token,$telegram_chatid,$msg);
            }
            $conn->commit(); $ok="Se aprobaron todas correctamente.";
        }catch(Exception $e){$conn->rollback();$error="Error: ".$e->getMessage();}
    }

    // Rechazar
    if($accion==='rechazada'){
        $liq_id=intval($_POST['liq_id']);
        $conn->query("UPDATE liquidaciones SET estado='rechazada' WHERE id=$liq_id");
        $ok="Solicitud rechazada.";
    }
    header("Location: liquidaciones.php"); exit();
}

// -------------------------------------------------------------------------
// 3️⃣ VISTAS
$planillas_efectivo=$conn->query("
SELECT p.*,v.codigo_vehiculo,
(SELECT COUNT(1) FROM liquidaciones l WHERE l.planilla_id=p.id AND l.estado='pendiente') AS solicitada
FROM planillas p
INNER JOIN vehiculos v ON p.vehiculo_id=v.id
WHERE p.tipo='efectivo' AND (p.pagada=0 OR p.pagada IS NULL)
ORDER BY p.fecha DESC
");

$solicitudes_pendientes=$conn->query("
SELECT l.id liq_id,l.planilla_id,l.created_at,u.usuario operador,p.numero_planilla,p.valor,v.codigo_vehiculo
FROM liquidaciones l
LEFT JOIN usuarios u ON l.operador_id=u.id
LEFT JOIN planillas p ON l.planilla_id=p.id
LEFT JOIN vehiculos v ON p.vehiculo_id=v.id
WHERE l.estado='pendiente'
ORDER BY l.created_at ASC
");
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
<h3>Liquidaciones</h3>
<?php if($ok):?><div class="alert alert-success"><?=htmlspecialchars($ok)?></div><?php endif;?>
<?php if($error):?><div class="alert alert-danger"><?=htmlspecialchars($error)?></div><?php endif;?>

<?php if(in_array($rol,['operador','admin'])):?>
<h5>1️⃣ Solicitar Liquidación (Efectivo)</h5>
<form method="POST">
<input type="hidden" name="solicitar" value="1">
<table class="table table-sm table-striped">
<thead><tr><th></th><th>Fecha</th><th>Vehículo</th><th>Conductor</th><th>N°</th><th>Valor</th></tr></thead>
<tbody>
<?php while($p=$planillas_efectivo->fetch_assoc()):?>
<tr>
<td><?=intval($p['solicitada'])>0?'<input type="checkbox" disabled>':'<input type="checkbox" name="planilla_ids[]" value="'.intval($p['id']).'">';?></td>
<td><?=date("d/m/Y h:i a",strtotime($p['fecha']??'now'))?></td>
<td><?=htmlspecialchars($p['codigo_vehiculo'])?></td>
<td><?=htmlspecialchars($p['conductor'])?></td>
<td><?=htmlspecialchars($p['numero_planilla'])?></td>
<td><?=number_format($p['valor'],0,',','.')?></td>
</tr>
<?php endwhile;?>
</tbody></table>
<button class="btn btn-primary">Solicitar</button>
</form>
<?php endif;?>

<h5 class="mt-4">2️⃣ Solicitudes Pendientes</h5>

<!-- ✅ BOTÓN IMPRIMIR (para cualquier rol) -->
<div class="mb-2">
    <button class="btn btn-info" onclick="printTable('tablaPendientes')">Imprimir tabla</button>
</div>

<?php if(in_array($rol,['tesorera','admin'])):?>
<form method="POST">
<input type="hidden" name="accion" value="aprobar_todas">
<button class="btn btn-success mb-2">Aprobar todas</button>
</form>
<?php endif;?>

<table class="table table-sm table-striped" id="tablaPendientes">
<thead><tr><th>ID</th><th>N°</th><th>Vehículo</th><th>Valor</th><th>Operador</th><th>Fecha</th><?php if(in_array($rol,['tesorera','admin'])) echo "<th>Acción</th>";?></tr></thead>
<tbody>
<?php $totalPend=0; while($s=$solicitudes_pendientes->fetch_assoc()): $totalPend+=floatval($s['valor']);?>
<tr>
<td><?=$s['liq_id']?></td>
<td><?=$s['numero_planilla']?></td>
<td><?=$s['codigo_vehiculo']?></td>
<td><?=number_format($s['valor'],0,',','.')?></td>
<td><?=$s['operador']?></td>
<td><?=date("d/m/Y h:i a",strtotime($s['created_at']))?></td>
<?php if(in_array($rol,['tesorera','admin'])):?>
<td>
<form method="POST" style="display:inline">
<input type="hidden" name="liq_id" value="<?=$s['liq_id']?>">
<button name="accion" value="aprobada" class="btn btn-sm btn-success">Aprobar</button>
</form>
<form method="POST" style="display:inline">
<input type="hidden" name="liq_id" value="<?=$s['liq_id']?>">
<button name="accion" value="rechazada" class="btn btn-sm btn-danger">Rechazar</button>
</form>
</td>
<?php endif;?>
</tr>
<?php endwhile;?>
</tbody>
<tfoot><tr class="table-secondary"><td colspan="3" class="text-end fw-bold">Total:</td><td><?=number_format($totalPend,0,',','.')?></td><td colspan="3"></td></tr></tfoot>
</table>

<script>
// ✅ Función imprimir tabla
function printTable(tableID){
    var table = document.getElementById(tableID).outerHTML;
    var ventana = window.open('', '', 'width=900,height=700');
    ventana.document.write('<html><head><title>Imprimir</title>');
    ventana.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    ventana.document.write('<style>body{padding:20px;} table{width:100%;}</style>');
    ventana.document.write('</head><body>');
    ventana.document.write('<h3>Solicitudes Pendientes</h3>');
    ventana.document.write(table);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.onload = function(){
        ventana.focus();
        ventana.print();
    };
}
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body></html>
