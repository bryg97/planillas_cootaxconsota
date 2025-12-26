<?php
include 'config.php';
if(!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin'){ header("Location: login.php"); exit(); }
$estado = supervisor_check($conn);
?>
<!doctype html><html><head><meta charset="utf-8"><title>Supervisor</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="p-4 bg-light"><div class="container"><h3>Supervisor del Sistema</h3><a href="panel.php" class="btn btn-secondary mb-3">Volver</a>
<div class="card p-3"><h5>Estado</h5><ul>
<?php foreach($estado as $k=>$v): ?><li><strong><?=htmlspecialchars($k)?>:</strong> <?=htmlspecialchars($v)?></li><?php endforeach; ?>
</ul></div></div></body></html>
