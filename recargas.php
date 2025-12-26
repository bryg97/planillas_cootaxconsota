<?php
// recargas.php — versión corregida y compatible con los nuevos módulos

ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

session_start();
include __DIR__ . '/config_planillas/config.php';
if(!isset($_SESSION['rol']) || ($_SESSION['rol'] != 'admin' && $_SESSION['rol'] != 'tesorera')){
    header("Location: login.php"); exit();
}

$message = '';

// Procesar recarga
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['recargar'])){
    $vehiculo_id = intval($_POST['vehiculo_id']);
    $nombre = trim($_POST['conductor']);
    $cedula = trim($_POST['cedula']);
    $valor = floatval($_POST['valor']);
    $autoriza = $_SESSION['usuario'] ?? 'admin';

    // Verificar deuda correcta (saldo_pendiente)
    $veh_check = $conn->query("SELECT saldo, saldo_pendiente FROM vehiculos WHERE id=$vehiculo_id")->fetch_assoc();

    if($veh_check['saldo_pendiente'] > 0){
        $message = "Este vehículo tiene planillas pendientes de pago. Antes de recargar debe liquidarlas en cartera.";
    } else {
        $stmt = $conn->prepare("UPDATE vehiculos SET saldo = saldo + ? WHERE id = ?");
        $stmt->bind_param("di", $valor, $vehiculo_id);
        if($stmt->execute()){
            $message = "Recarga registrada correctamente.";
        } else {
            $message = "Error al registrar la recarga: " . $conn->error;
        }
    }
}

// Obtener vehículos con saldo_pendiente incluido
$veh = $conn->query("
    SELECT id, codigo_vehiculo, saldo, saldo_pendiente 
    FROM vehiculos 
    ORDER BY CAST(REPLACE(codigo_vehiculo,'J-','') AS UNSIGNED) ASC
");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Recargas Débito</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<style>
.select2-container .select2-selection--single { height: calc(2.25rem + 2px) !important; padding: .375rem .75rem; font-size:1rem; border-radius:.375rem;}
.select2-container--default .select2-selection--single .select2-selection__arrow { height: calc(2.25rem + 2px) !important; right:.75rem;}
td.saldo-negativo { color:red; font-weight:bold;}
.modal-alert .modal-content { 
    background-color:#ffe6e6; 
    border-left:6px solid #ff3333; 
    border-radius:0.5rem;
    box-shadow:0 5px 15px rgba(0,0,0,0.3);
}
.modal-alert .modal-title { font-weight:700; font-size:1.3rem; }
.modal-alert .modal-body { font-size:1.1rem; color:#333; }
@keyframes slideInTop {
  0% { transform: translateY(-100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.slide-in-top { animation: slideInTop 0.5s ease forwards; }
</style>
</head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Recargas Débito</h3>
<?php if($message): ?>
<div class="alert alert-info"><?= htmlspecialchars($message) ?></div>
<?php endif; ?>

<form method="POST" class="row g-2 mb-3" id="formRecarga">
  <input type="hidden" name="recargar" value="1">
  <div class="col-md-3">
    <label>Vehículo</label>
    <select name="vehiculo_id" id="vehiculo_id" class="form-select" required>
      <option value="">Seleccione...</option>
      <?php while($v=$veh->fetch_assoc()): ?>
        <option 
            value="<?= $v['id'] ?>" 
            data-saldo="<?= $v['saldo'] ?>" 
            data-deuda="<?= $v['saldo_pendiente'] ?>">
          <?= htmlspecialchars($v['codigo_vehiculo']) ?> 
          (Saldo: <?= $v['saldo'] ?> / Deuda: <?= $v['saldo_pendiente'] ?>)
        </option>
      <?php endwhile; ?>
    </select>
  </div>
  <div class="col-md-3"><label>Conductor</label><input name="conductor" class="form-control" required></div>
  <div class="col-md-2"><label>Cédula</label><input name="cedula" class="form-control"></div>
  <div class="col-md-2"><label>Valor</label><input name="valor" type="number" step="0.01" class="form-control" required></div>
  <div class="col-md-2 align-self-end"><button class="btn btn-success w-100" id="btnRecargar">Recargar</button></div>
</form>

<h5>Vehículos</h5>
<table class="table">
<thead><tr><th>Vehículo</th><th>Saldo</th><th>Deuda</th><th>Acción</th></tr></thead>
<tbody id="tablaVehiculos">
<?php
$vh2 = $conn->query("SELECT id, codigo_vehiculo, saldo, saldo_pendiente FROM vehiculos ORDER BY CAST(REPLACE(codigo_vehiculo,'J-','') AS UNSIGNED) ASC");
while($r=$vh2->fetch_assoc()){
    $saldo_clase = $r['saldo_pendiente'] > 0 ? 'saldo-negativo' : '';
    echo "<tr data-id='{$r['id']}' data-saldo='{$r['saldo']}' data-deuda='{$r['saldo_pendiente']}'>
            <td>{$r['codigo_vehiculo']}</td>
            <td>{$r['saldo']}</td>
            <td class='$saldo_clase'>{$r['saldo_pendiente']}</td>
            <td>";
    if($r['saldo_pendiente'] == 0){
        echo "<button class='btn btn-primary btnEditar'>Editar</button>";
    } else {
        echo "<button class='btn btn-secondary' disabled>Editar</button>";
    }
    echo "</td></tr>";
}
?>
</tbody>
</table>

<!-- Modal editar saldo -->
<div class="modal fade" id="modalEditar" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <form id="formEditarSaldo" method="POST">
      <div class="modal-header">
        <h5 class="modal-title">Editar Saldo Vehículo</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
          <input type="hidden" name="vehiculo_id" id="editVehId">
          <div class="mb-3">
            <label>Saldo</label>
            <input type="number" step="0.01" class="form-control" name="saldo" id="editSaldo" required>
          </div>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-success">Guardar</button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
      </form>
    </div>
  </div>
</div>

<!-- Modal alerta saldo negativo -->
<div class="modal fade modal-alert" id="modalSaldoNegativo" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content slide-in-top p-3">
      <div class="modal-header">
        <h5 class="modal-title text-danger">⚠️ ¡Saldo Pendiente de Pago!</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        Este vehículo tiene <strong>planillas pendientes de pago</strong>.  
        Antes de realizar una recarga debe liquidarlas en cartera.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
      </div>
    </div>
  </div>
</div>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script>
$(document).ready(function() {

    $('#vehiculo_id').select2({
        width:'100%',
        placeholder:'Buscar o seleccionar vehículo',
        allowClear:true
    });

    // Detectar deuda (saldo_pendiente)
    $('#vehiculo_id').change(function(){
        let deuda = parseFloat($('#vehiculo_id option:selected').data('deuda'));

        if(deuda > 0){
            let modal = new bootstrap.Modal(document.getElementById('modalSaldoNegativo'));
            modal.show();

            $('#formRecarga input[name="conductor"], #formRecarga input[name="cedula"], #formRecarga input[name="valor"]').prop('disabled',true);
            $('#btnRecargar').prop('disabled',true);

        } else {
            $('#formRecarga input[name="conductor"], #formRecarga input[name="cedula"], #formRecarga input[name="valor"]').prop('disabled',false);
            $('#btnRecargar').prop('disabled',false);
        }
    });

    // Editar saldo
    $('.btnEditar').click(function(){
        let fila = $(this).closest('tr');
        $('#editVehId').val(fila.data('id'));
        $('#editSaldo').val(fila.data('saldo'));

        let modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
    });

    // Guardar saldo con AJAX
    $('#formEditarSaldo').submit(function(e){
        e.preventDefault();
        $.post('editar_saldo.php', $(this).serialize(), function(resp){
            if(resp.trim()=='ok'){
                location.reload();
            } else {
                alert('Error al actualizar saldo');
            }
        });
    });

});
</script>
</body>
</html>
