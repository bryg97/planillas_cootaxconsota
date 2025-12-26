<?php
// usuarios.php
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include __DIR__ . '/config_planillas/config.php';

if(!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin'){
    header("Location: login.php"); exit();
}

// Acciones: crear, eliminar, editar password, asignar modulos (básico)
if($_SERVER['REQUEST_METHOD'] === 'POST'){
    if(isset($_POST['crear'])){
        $usuario = trim($_POST['usuario']);
        $clave = password_hash($_POST['clave'], PASSWORD_BCRYPT);
        $rol = $_POST['rol'];
        $stmt = $conn->prepare("INSERT INTO usuarios (usuario, clave, rol) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $usuario, $clave, $rol);
        $stmt->execute();
    }

    if(isset($_POST['eliminar']) && is_numeric($_POST['usuario_id'])){
        $id = intval($_POST['usuario_id']);
        // evitar eliminar al propio admin por error
        if($id !== $_SESSION['id_usuario']){
            $stmt = $conn->prepare("DELETE FROM usuarios WHERE id=?");
            $stmt->bind_param("i",$id);
            $stmt->execute();
        }
    }

    if(isset($_POST['cambiar_clave'])){
        $id = intval($_POST['usuario_id']);
        $nueva = password_hash($_POST['nueva_clave'], PASSWORD_BCRYPT);
        $stmt = $conn->prepare("UPDATE usuarios SET clave=? WHERE id=?");
        $stmt->bind_param("si",$nueva,$id);
        $stmt->execute();
    }
    // al terminar recargar
    header("Location: usuarios.php");
    exit();
}

// listar usuarios
$res = $conn->query("SELECT id, usuario, rol, created_at FROM usuarios ORDER BY id DESC");
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Usuarios</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Usuarios</h3>

<!-- Crear -->
<div class="card mb-3 p-3">
  <form method="POST" class="row g-2">
    <input type="hidden" name="crear" value="1">
    <div class="col-md-3"><input required name="usuario" class="form-control" placeholder="Usuario"></div>
    <div class="col-md-3"><input required type="password" name="clave" class="form-control" placeholder="Contraseña"></div>
    <div class="col-md-3">
      <select name="rol" class="form-select">
        <option value="operador">Operador</option>
        <option value="tesorera">Tesorera</option>
        <option value="admin">Admin</option>
      </select>
    </div>
    <div class="col-md-3"><button class="btn btn-primary w-100">Crear usuario</button></div>
  </form>
</div>

<table class="table table-striped">
<thead><tr><th>#</th><th>Usuario</th><th>Rol</th><th>Creado</th><th>Acciones</th></tr></thead>
<tbody>
<?php while($u = $res->fetch_assoc()): ?>
<tr>
  <td><?= $u['id'] ?></td>
  <td><?= htmlspecialchars($u['usuario']) ?></td>
  <td><?= htmlspecialchars($u['rol']) ?></td>
  <td><?= $u['created_at'] ?></td>
  <td>
    <form method="POST" style="display:inline">
      <input type="hidden" name="usuario_id" value="<?= $u['id'] ?>">
      <button type="button" class="btn btn-sm btn-warning" onclick="openPass(<?= $u['id'] ?>,'<?= htmlspecialchars($u['usuario']) ?>')">Cambiar contraseña</button>
    </form>
    <?php if($u['id'] != $_SESSION['id_usuario']): ?>
    <form method="POST" style="display:inline" onsubmit="return confirm('Eliminar usuario?');">
      <input type="hidden" name="usuario_id" value="<?= $u['id'] ?>">
      <input type="hidden" name="eliminar" value="1">
      <button class="btn btn-sm btn-danger">Eliminar</button>
    </form>
    <?php endif; ?>
  </td>
</tr>
<?php endwhile; ?>
</tbody>
</table>

<!-- Modal cambiar clave (simple) -->
<div id="passModal" style="display:none; position:fixed; left:0;top:0;right:0;bottom:0; background:rgba(0,0,0,0.4)">
  <div style="width:420px;margin:6% auto;background:#fff;padding:20px;border-radius:8px">
    <h5>Cambiar contraseña <span id="userLabel"></span></h5>
    <form method="POST">
      <input type="hidden" name="usuario_id" id="modal_user_id">
      <input type="hidden" name="cambiar_clave" value="1">
      <div class="mb-2"><input type="password" name="nueva_clave" class="form-control" placeholder="Nueva contraseña" required></div>
      <div class="d-flex gap-2"><button class="btn btn-primary">Guardar</button><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button></div>
    </form>
  </div>
</div>

<script>
function openPass(id, user){
  document.getElementById('modal_user_id').value = id;
  document.getElementById('userLabel').innerText = ' - ' + user;
  document.getElementById('passModal').style.display='block';
}
function closeModal(){
  document.getElementById('passModal').style.display='none';
}
</script>
</body>
</html>
