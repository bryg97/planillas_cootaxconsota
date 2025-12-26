<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
include __DIR__ . '/config_planillas/config.php';

if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}

$path = __DIR__;
$resultados = [];
$totalErrores = 0;
$totalArchivos = 0;

// Crear tabla de auditoría si no existe
$conn->query("
CREATE TABLE IF NOT EXISTS auditoria_ia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    archivo VARCHAR(255),
    estado VARCHAR(50),
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
");

function analizarPHP($archivo) {
    $estado = 'OK';
    $detalles = '';

    // Leer contenido y probar apertura
    $contenido = @file_get_contents($archivo);
    if ($contenido === false) {
        $estado = 'Error';
        $detalles = 'No se pudo leer el archivo.';
        return compact('estado', 'detalles');
    }

    // Comprobar etiquetas PHP de apertura y cierre
    if (strpos($contenido, '<?php') === false) {
        $estado = 'Advertencia';
        $detalles = 'No contiene etiqueta de apertura PHP.';
    }

    // Verificar estructura básica (pares de llaves, comillas)
    $openBraces = substr_count($contenido, '{');
    $closeBraces = substr_count($contenido, '}');
    if ($openBraces !== $closeBraces) {
        $estado = 'Error';
        $detalles .= "\nDesbalance de llaves detectado.";
    }

    return compact('estado', 'detalles');
}

// Recorrer todos los archivos PHP
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path)) as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        $totalArchivos++;
        $r = analizarPHP($file);

        $archivo = basename($file);
        $estado = $r['estado'];
        $detalles = $r['detalles'];

        $stmt = $GLOBALS['conn']->prepare("INSERT INTO auditoria_ia (archivo, estado, detalles) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $archivo, $estado, $detalles);
        $stmt->execute();

        if ($estado !== 'OK') $totalErrores++;

        $resultados[] = [
            'archivo' => $archivo,
            'estado' => $estado,
            'detalles' => $detalles
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Supervisor IA - Analizador de Archivos</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body { background: #f8f9fa; padding: 2rem; }
.table td, .table th { vertical-align: middle; }
.status-ok { color: green; font-weight: bold; }
.status-error { color: red; font-weight: bold; }
.status-advertencia { color: orange; font-weight: bold; }
.summary { margin-top: 1.5rem; font-size: 1.1rem; }
</style>
</head>
<body>
<div class="container">
    <h2 class="mb-4 text-center">🤖 Supervisor IA - Analizador de Archivos PHP</h2>
    <a href="panel.php" class="btn btn-secondary mb-3">⬅️ Volver al Panel</a>

    <table class="table table-bordered table-striped">
        <thead class="table-dark">
            <tr><th>Archivo</th><th>Estado</th><th>Detalles</th></tr>
        </thead>
        <tbody>
        <?php foreach ($resultados as $r): ?>
            <tr>
                <td><?= htmlspecialchars($r['archivo']) ?></td>
                <td class="<?= $r['estado'] === 'OK' ? 'status-ok' : ($r['estado'] === 'Advertencia' ? 'status-advertencia' : 'status-error') ?>">
                    <?= htmlspecialchars($r['estado']) ?>
                </td>
                <td><pre style="white-space: pre-wrap;"><?= htmlspecialchars($r['detalles'] ?: 'Sin errores detectados') ?></pre></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <div class="summary">
        <p><strong>Total de archivos analizados:</strong> <?= $totalArchivos ?></p>
        <p><strong>Total de errores detectados:</strong> <?= $totalErrores ?></p>
        <?php if ($totalErrores === 0): ?>
            <div class="alert alert-success">✅ Todos los archivos están correctamente estructurados.</div>
        <?php else: ?>
            <div class="alert alert-warning">⚠️ Se detectaron errores o advertencias.</div>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
