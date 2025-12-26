<?php
// auditoria.php
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include __DIR__ . '/../../config_planillas/config.php';
if(!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin'){ header("Location: login.php"); exit(); }

$res = $conn->query("SELECT * FROM auditoria_ia ORDER BY fecha DESC LIMIT 200");
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Auditoría</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Auditoría de archivos</h3>
<table class="table table-sm"><thead><tr><th>Fecha</th><th>Archivo</th><th>Estado</th><th>Detalles</th></tr></thead><tbody>
<?php while($r=$res->fetch_assoc()): ?>
<tr>
<td><?= $r['fecha'] ?></td>
<td><?= htmlspecialchars($r['archivo']) ?></td>
<td><?= htmlspecialchars($r['estado']) ?></td>
<td><pre style="white-space:pre-wrap;"><?= htmlspecialchars($r['detalles']) ?></pre></td>
</tr>
<?php endwhile; ?>
</tbody></table>
</body></html>
