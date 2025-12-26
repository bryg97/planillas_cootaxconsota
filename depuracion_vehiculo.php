<?php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

session_start();
include __DIR__ . '/config_planillas/config.php';

// Solo admin
if(!isset($_SESSION['rol']) || $_SESSION['rol']!='admin'){
    die("Solo ADMIN");
}

$ok = '';
$codigo = $_POST['codigo_vehiculo'] ?? '';
$confirm = $_POST['confirm'] ?? '';

if($_SERVER['REQUEST_METHOD']==='POST' && $codigo && $confirm==='1'){

    // Buscar vehículo por código
    $stmt = $conn->prepare("SELECT id, saldo FROM vehiculos WHERE codigo_vehiculo=? LIMIT 1");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $veh = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$veh){
        $ok = "Vehículo con código '$codigo' no encontrado.";
    } else {
        $veh_id = intval($veh['id']);

        // Desactivar llaves foráneas temporalmente
        $conn->query("SET FOREIGN_KEY_CHECKS=0");

        // Limpiar planillas e historial del vehículo
        $stmt = $conn->prepare("DELETE FROM planillas WHERE vehiculo_id=?");
        $stmt->bind_param("i", $veh_id);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM planillas_historial WHERE vehiculo_id=?");
        $stmt->bind_param("i", $veh_id);
        $stmt->execute();
        $stmt->close();

        // Reset saldo a 0
        $stmt = $conn->prepare("UPDATE vehiculos SET saldo=0 WHERE id=?");
        $stmt->bind_param("i", $veh_id);
        $stmt->execute();
        $stmt->close();

        $conn->query("SET FOREIGN_KEY_CHECKS=1");

        $ok = "✅ Depuración completada para vehículo '$codigo'. Planillas eliminadas y saldo a 0.";
    }
}

?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Depuración por Vehículo</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css">
</head>
<body class="p-4">

<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Depuración de un vehículo específico</h3>

<?php if($ok): ?>
<div class="alert alert-success mt-3"><?=$ok?></div>
<?php endif; ?>

<form id="depForm" method="POST" class="mt-3">
  <div class="mb-3">
    <label for="codigo_vehiculo" class="form-label">Escribe el código del vehículo</label>
    <input type="text" id="codigo_vehiculo" name="codigo_vehiculo" class="form-control" value="<?=htmlspecialchars($codigo)?>" required>
  </div>
  <input type="hidden" name="confirm" id="confirm" value="0">
  <button type="button" class="btn btn-danger w-100" id="btnDepurar">Depurar este vehículo</button>
</form>

<!-- Modal de confirmación -->
<div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Confirmar Depuración</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        ⚠️ Esto eliminará todas las planillas e historial del vehículo y pondrá su saldo en 0. ¿Estás seguro?
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="confirmYes">Sí, depurar</button>
      </div>
    </div>
  </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
$(function() {
    // Autocomplete
    $("#codigo_vehiculo").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: "autocomplete_vehiculos.php",
                dataType: "json",
                data: { term: request.term },
                success: function(data) { response(data); }
            });
        },
        minLength: 1
    });

    // Abrir modal al presionar depurar
    $("#btnDepurar").click(function(){
        if($("#codigo_vehiculo").val().trim() === ''){
            alert("Debes escribir un código de vehículo");
            return;
        }
        var modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
    });

    // Confirmar depuración
    $("#confirmYes").click(function(){
        $("#confirm").val('1');
        $("#depForm").submit();
    });
});
</script>

</body>
</html>
