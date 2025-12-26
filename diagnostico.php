<?php
// supervisor_ia.php — Diagnóstico y corrección de PHP y DB
session_start();
date_default_timezone_set('America/Bogota');

// Configuración DB
$servername = "localhost";
$username   = "u406926550_planillas";
$password   = "!AwbD$3k";
$dbname     = "u406926550_planillas";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) die("Error de conexión: ".$conn->connect_error);
$conn->query("SET time_zone='-05:00'");

// Solo admin
if(!isset($_SESSION['rol']) || $_SESSION['rol']!=='admin'){
    header("Location: login.php");
    exit();
}

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

// Opciones de ejecución
$modo = $_POST['modo'] ?? 'analizar'; // analizar o auto_fix

$path = __DIR__;
$resultados = [];
$totalArchivos = 0;
$totalErrores = 0;

function analizarPHP($archivo){
    $estado = 'OK';
    $detalles = '';
    $correccion = false;

    $contenido = @file_get_contents($archivo);
    if($contenido===false){
        return ['estado'=>'Error','detalles'=>'No se pudo leer el archivo','correccion'=>false];
    }

    // Falta etiqueta PHP
    if(strpos($contenido,'<?php')===false){
        $estado = 'Advertencia';
        $detalles .= "No contiene '<?php'.\n";
        $correccion = true;
        $contenido = "<?php\n".$contenido;
    }

    // Balance de llaves
    $open = substr_count($contenido,'{');
    $close = substr_count($contenido,'}');
    if($open!=$close){
        $estado = 'Error';
        $detalles .= "Desbalance de llaves: {$open} abiertas, {$close} cerradas.\n";
        $correccion = true;
    }

    // Verificación de includes/require
    preg_match_all('/(include|require)(_once)?\s*\(\s*[\'"](.*?)[\'"]\s*\)/i',$contenido,$matches);
    foreach($matches[3] as $inc){
        $ruta = realpath(dirname($archivo).'/'.$inc);
        if(!$ruta || !file_exists($ruta)){
            $estado = 'Advertencia';
            $detalles .= "Archivo incluido no existe: $inc\n";
        }
    }

    return ['estado'=>$estado,'detalles'=>$detalles,'correccion'=>$correccion,'contenido'=>$contenido];
}

// Eliminar tablas innecesarias (solo ejemplo: si existe tabla vieja 'auditoria_old')
$conn->query("DROP TABLE IF EXISTS auditoria_old");

foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path)) as $file){
    if(pathinfo($file,PATHINFO_EXTENSION)!=='php') continue;
    $totalArchivos++;
    $r = analizarPHP($file);

    $archivo = basename($file);
    $estado  = $r['estado'];
    $detalles= $r['detalles'];

    // Guardar historial
    $stmt = $conn->prepare("INSERT INTO auditoria_ia (archivo, estado, detalles) VALUES (?,?,?)");
    $stmt->bind_param("sss",$archivo,$estado,$detalles);
    $stmt->execute();

    // Aplicar corrección si auto_fix
    if($modo==='auto_fix' && $r['correccion']){
        file_put_contents($file,$r['contenido']);
        $detalles .= "⚡ Corrección aplicada automáticamente.\n";
        $stmt = $conn->prepare("UPDATE auditoria_ia SET detalles=? WHERE archivo=? ORDER BY id DESC LIMIT 1");
        $stmt->bind_param("ss",$detalles,$archivo);
        $stmt->execute();
        $estado .= ' (fix)';
    }

    if($estado!=='OK') $totalErrores++;
    $resultados[] = ['archivo'=>$archivo,'estado'=>$estado,'detalles'=>$detalles];
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Supervisor IA - Diagnóstico y Corrección</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body {background:#f8f9fa; padding:2rem;}
.table td, .table th {vertical-align:middle;}
.status-ok {color:green;font-weight:bold;}
.status-error {color:red;font-weight:bold;}
.status-advertencia {color:orange;font-weight:bold;}
.summary {margin-top:1.5rem;font-size:1.1rem;}
</style>
</head>
<body>
<div class="container">
<h2 class="mb-4 text-center">🤖 Supervisor IA - Diagnóstico y Corrección</h2>
<a href="panel.php" class="btn btn-secondary mb-3">⬅️ Volver al Panel</a>

<div class="card p-3 mb-3">
<form method="post">
<label class="form-label">Modo de ejecución</label>
<select name="modo" class="form-select mb-2">
<option value="analizar" <?= $modo==='analizar'?'selected':'' ?>>Analizar (solo informe)</option>
<option value="auto_fix" <?= $modo==='auto_fix'?'selected':'' ?>>Analizar y corregir automáticamente</option>
</select>
<button class="btn btn-success" type="submit">Ejecutar</button>
</form>
</div>

<table class="table table-bordered table-striped">
<thead class="table-dark">
<tr><th>Archivo</th><th>Estado</th><th>Detalles</th></tr>
</thead>
<tbody>
<?php foreach($resultados as $r): ?>
<tr>
<td><?= htmlspecialchars($r['archivo']) ?></td>
<td class="<?= $r['estado']==='OK' ? 'status-ok' : (strpos($r['estado'],'Advertencia')!==false ? 'status-advertencia' : 'status-error') ?>">
<?= htmlspecialchars($r['estado']) ?></td>
<td><pre style="white-space: pre-wrap;"><?= htmlspecialchars($r['detalles']?:'Sin errores') ?></pre></td>
</tr>
<?php endforeach; ?>
</tbody>
</table>

<div class="summary">
<p><strong>Total de archivos analizados:</strong> <?= $totalArchivos ?></p>
<p><strong>Total de errores/advertencias:</strong> <?= $totalErrores ?></p>
<?php if($totalErrores===0): ?>
<div class="alert alert-success">✅ Todos los archivos correctos.</div>
<?php else: ?>
<div class="alert alert-warning">⚠️ Se detectaron errores o advertencias.</div>
<?php endif; ?>
</div>

</div>
</body>
</html>
