<?php
// ver_archivo.php
session_start();
include 'config.php';
if(!isset($_SESSION['rol']) || $_SESSION['rol']!=='admin'){ header("Location: login.php"); exit(); }

$file = $_GET['file'] ?? '';
$root = __DIR__;
$path = realpath($root . '/' . $file);

// seguridad: evitar salir del directorio
if(!$path || strpos($path, $root) !== 0){
    die("Acceso inválido");
}

$content = file_get_contents($path);
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Ver / Editar archivo - <?= htmlspecialchars($file) ?></title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>pre{white-space:pre-wrap;}</style>
</head>
<body class="p-3">
  <a href="diagnostico.php" class="btn btn-secondary mb-2">⬅ Volver</a>
  <h5>Ver archivo: <?= htmlspecialchars($file) ?></h5>
  <div class="mb-2 small text-muted">Ruta: <?= htmlspecialchars($path) ?></div>

  <form method="post" action="guardar_archivo.php">
    <input type="hidden" name="file" value="<?= htmlspecialchars($file) ?>">
    <div class="mb-2">
      <textarea name="content" rows="20" class="form-control"><?= htmlspecialchars($content) ?></textarea>
    </div>
    <div class="d-flex gap-2">
      <button type="submit" name="action" value="save" class="btn btn-primary">Guardar cambios</button>
      <a href="diagnostico.php" class="btn btn-outline-secondary">Cancelar</a>
    </div>
  </form>
</body>
</html>
