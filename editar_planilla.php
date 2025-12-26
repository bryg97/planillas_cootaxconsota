<?php
include __DIR__ . '/../../config_planillas/config.php';
if(!isset($_SESSION['rol'])){ header('Location: login.php'); exit(); }
$id = intval($_GET['id'] ?? 0);
if ($id <= 0) { header('Location: planillas.php'); exit(); }
$msg=''; $err='';
if($_SERVER['REQUEST_METHOD']==='POST'){
    $conductor = trim($_POST['conductor']); $cedula = trim($_POST['cedula']); $valor=floatval($_POST['valor']);
    $stmt = $conn->prepare('UPDATE planillas SET conductor=?, cedula_conductor=?, valor=? WHERE id=?');
    $stmt->bind_param('ssdi',$conductor,$cedula,$valor,$id);
    if($stmt->execute()){ $msg='Planilla actualizada.'; registrar_auditoria('Editó planilla ID '.$id,'Planillas'); }
    else $err='Error: '.$stmt->error;
}
$p = $conn->query('SELECT * FROM planillas WHERE id='.$id)->fetch_assoc();
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Editar Planilla</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><div class="container mt-4">
  <h3>Editar Planilla <?=$id?></h3>
  <a href="planillas.php" class="btn btn-secondary mb-3">Regresar</a>
  <?php if($msg): ?><div class="alert alert-success"><?=htmlspecialchars($msg)?></div><?php endif; ?>
  <?php if($err): ?><div class="alert alert-danger"><?=htmlspecialchars($err)?></div><?php endif; ?>
  <form method="post">
    <div class="mb-3"><label>Conductor</label><input name="conductor" class="form-control" value="<?=htmlspecialchars($p['conductor'])?>"></div>
    <div class="mb-3"><label>Cédula</label><input name="cedula" class="form-control" value="<?=htmlspecialchars($p['cedula_conductor'] ?? '')?>"></div>
    <div class="mb-3"><label>Valor</label><input name="valor" type="number" step="0.01" class="form-control" value="<?=htmlspecialchars($p['valor'])?>"></div>
    <button class="btn btn-primary">Guardar</button>
  </form>
</div></body></html>
