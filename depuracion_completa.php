<?php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

session_start();
include __DIR__ . '/config_planillas/config.php';

if(!isset($_SESSION['rol']) || $_SESSION['rol'] != 'admin') {
    die("Solo ADMIN");
}

$ok = '';
$error = '';

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $codigo_vehiculo = trim($_POST['codigo_vehiculo'] ?? '');

    if(!$codigo_vehiculo){
        $error = "Debe ingresar un código de vehículo.";
    } else {
        // Buscar id del vehículo
        $stmt = $conn->prepare("SELECT id, saldo FROM vehiculos WHERE codigo_vehiculo = ?");
        $stmt->bind_param("s", $codigo_vehiculo);
        $stmt->execute();
        $veh = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if(!$veh){
            $error = "No se encontró vehículo con código '$codigo_vehiculo'.";
        } else {
            $veh_id = intval($veh['id']);

            // Desactivar llaves foráneas temporalmente
            $conn->query("SET FOREIGN_KEY_CHECKS=0");

            // Limpiar planillas e historial solo de este vehículo
            $conn->query("DELETE FROM planillas WHERE vehiculo_id = $veh_id");
            $conn->query("DELETE FROM planillas_historial WHERE vehiculo_id = $veh_id");

            // Poner saldo a 0
            $conn->query("UPDATE vehiculos SET saldo = 0 WHERE id = $veh_id");

            // Reactivar llaves foráneas
            $conn->query("SET FOREIGN_KEY_CHECKS=1");

            $ok = "Depuración completada para el vehículo '$codigo_vehiculo'.";
        }
    }
}
?>

<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Depuración por Vehículo</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">

<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Depuración de registros y saldo de un vehículo</h3>

<?php if($error): ?>
<div class="alert alert-danger"><?=$error?></div>
<?php endif; ?>

<?php if($ok): ?>
<div class="alert alert-success"><?=$ok?></div>
<?php endif; ?>

<form method="POST" class="mt-3">
    <div class="mb-3">
        <label for="codigo_vehiculo" class="form-label">Código de Vehículo</label>
        <input type="text" name="codigo_vehiculo" id="codigo_vehiculo" class="form-control" required>
    </div>
    <button type="submit" class="btn btn-danger w-100">Depurar Vehículo</button>
</form>

</body>
</html>
