<?php
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include __DIR__ . '/../../config_planillas/config.php';

if(!isset($_SESSION['rol'])){ header("Location: login.php");exit(); }
$rol = $_SESSION['rol'];
if($rol!='admin'){ die("Solo ADMIN"); }

$ok='';
if($_SERVER['REQUEST_METHOD']==='POST'){
    $op = $_POST['op'] ?? '';

    // desactivar llaves foraneas
    $conn->query("SET FOREIGN_KEY_CHECKS=0");

    if($op=='1'){ // solo planillas
        $conn->query("TRUNCATE planillas");
        $ok="Planillas limpiadas.";
    }
    if($op=='2'){ // plan + hist
        $conn->query("TRUNCATE planillas");
        $conn->query("TRUNCATE planillas_historial");
        $ok="Planillas + historial limpiadas.";
    }
    if($op=='3'){ // solo liquidaciones
        $conn->query("TRUNCATE liquidaciones");
        $conn->query("TRUNCATE liquidaciones_historial");
        $ok="Liquidaciones limpiadas.";
    }
    if($op=='4'){ // total
        $conn->query("TRUNCATE liquidaciones_historial");
        $conn->query("TRUNCATE liquidaciones");
        $conn->query("TRUNCATE planillas_historial");
        $conn->query("TRUNCATE planillas");
        $ok="TODO limpiado.";
    }

    // activar llaves foraneas
    $conn->query("SET FOREIGN_KEY_CHECKS=1");
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Depuración</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Depuración del sistema</h3>

<?php if($ok): ?>
<div class="alert alert-success"><?=$ok?></div>
<?php endif; ?>

<form method="POST" class="mt-3">

<button class="btn btn-warning w-100 mb-2" name="op" value="1">
Limpiar SOLO planillas
</button>

<button class="btn btn-warning w-100 mb-2" name="op" value="2">
Limpiar planillas + planillas_historial
</button>

<button class="btn btn-warning w-100 mb-2" name="op" value="3">
Limpiar SOLO liquidaciones
</button>

<button class="btn btn-danger w-100 mb-2" name="op" value="4">
LIMPIAR TODO (planillas + historiales + liquidaciones)
</button>

</form>

</body>
</html>
