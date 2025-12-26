<?php
// planillas_crear.php — Crea planillas correctamente con reglas contables
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include 'config.php';
if(!isset($_SESSION['rol'])){ header("Location: login.php"); exit(); }

$rol = $_SESSION['rol'];
if(!in_array($rol, ['operador','admin','tesorera'])){ die("No autorizado"); }

date_default_timezone_set('America/Bogota');
$usuario = $_SESSION['usuario'] ?? '';
$user_id = $_SESSION['id_usuario'] ?? null;

$msg = '';
$vehiculos = $conn->query("SELECT id, codigo_vehiculo, saldo FROM vehiculos ORDER BY CAST(REPLACE(codigo_vehiculo,'J-','') AS UNSIGNED) ASC");

if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['crear'])){
    $vehiculo_id = intval($_POST['vehiculo_id']);
    $conductor = trim($_POST['conductor']);
    $tipo = trim($_POST['tipo']);
    $valor = floatval($_POST['valor']);

    $ultimo = $conn->query("SELECT numero_planilla FROM planillas ORDER BY id DESC LIMIT 1")->fetch_assoc();
    $nuevo_num = $ultimo ? intval(preg_replace('/[^0-9]/','',$ultimo['numero_planilla'])) + 1 : 1;
    $numero_planilla = 'J-'.str_pad($nuevo_num, 3, '0', STR_PAD_LEFT);

    $fecha = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("INSERT INTO planillas (vehiculo_id, conductor, tipo, valor, numero_planilla, fecha, operador_id, pagada)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->bind_param("issdssi", $vehiculo_id, $conductor, $tipo, $valor, $numero_planilla, $fecha, $user_id);

    if($stmt->execute()){
        if($tipo == 'debito'){
            $conn->query("UPDATE vehiculos SET saldo = saldo - $valor WHERE id = $vehiculo_id");
        }

        $conn->query("INSERT INTO auditoria (usuario,accion,detalles)
                      VALUES ('$usuario','Creación planilla','$numero_planilla tipo $tipo valor $valor vehiculo $vehiculo_id')");

        $msg = "Planilla $numero_planilla registrada correctamente.";
    } else {
        $msg = "Error: ".$stmt->error;
    }
}
?>
<!doctype html>
<html lang='es'>
<head><meta charset='utf-8'><title>Nueva Planilla</title>
<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet'>
</head>
<body class='p-4'>
<a href='panel.php' class='btn btn-secondary mb-3'>⬅ Panel</a>
<h3>Nueva Planilla</h3>
<?php if($msg): ?><div class='alert alert-info'><?= htmlspecialchars($msg) ?></div><?php endif; ?>
<form method='POST' class='row g-2'>
  <input type='hidden' name='crear' value='1'>
  <div class='col-md-3'>
    <label>Vehículo</label>
    <select name='vehiculo_id' class='form-select' required>
      <?php while($v=$vehiculos->fetch_assoc()): ?>
        <option value='<?= $v['id'] ?>'><?= htmlspecialchars($v['codigo_vehiculo']) ?> (Saldo: <?= $v['saldo'] ?>)</option>
      <?php endwhile; ?>
    </select>
  </div>
  <div class='col-md-3'><label>Conductor</label><input name='conductor' class='form-control' required></div>
  <div class='col-md-2'>
    <label>Tipo</label>
    <select name='tipo' class='form-select' required>
      <option value='credito'>Crédito</option>
      <option value='debito'>Débito</option>
      <option value='efectivo'>Efectivo</option>
    </select>
  </div>
  <div class='col-md-2'><label>Valor</label><input type='number' step='0.01' name='valor' class='form-control' required></div>
  <div class='col-md-2 align-self-end'><button class='btn btn-success w-100'>Registrar</button></div>
</form>
</body></html>
