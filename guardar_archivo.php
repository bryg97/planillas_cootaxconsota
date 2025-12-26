<?php
// guardar_archivo.php
session_start();
include 'config.php';
if(!isset($_SESSION['rol']) || $_SESSION['rol']!=='admin'){ header("Location: login.php"); exit(); }

$file = $_POST['file'] ?? '';
$content = $_POST['content'] ?? '';
$root = __DIR__;
$path = realpath($root . '/' . $file);

// seguridad
if(!$path || strpos($path, $root) !== 0){
    die("Acceso inválido");
}

// crear backup
$backup_dir = $root.'/backups';
if(!is_dir($backup_dir)) mkdir($backup_dir,0755,true);
$bak_file = $backup_dir . '/' . basename($file) . '.' . time() . '.bak';
if(false === file_put_contents($bak_file, file_get_contents($path))){
    die("No se pudo crear backup");
}

// escribir archivo temporal y chequear sintaxis si es posible
$can_lint = function_exists('shell_exec');
$lint_ok = null;
$lint_output = '';
if($can_lint){
    $tmp = $backup_dir . '/tmp_'.time().'.php';
    file_put_contents($tmp, $content);
    $out = shell_exec("php -l " . escapeshellarg($tmp) . " 2>&1");
    $lint_output = $out;
    unlink($tmp);
    if(stripos($out, 'No syntax errors detected') !== false) $lint_ok = true;
    else $lint_ok = false;
}

// si lint_ok === false -> no sobrescribir y avisar
if($lint_ok === false){
    // registrar en BD
    $stmt = $conn->prepare("INSERT INTO supervisor_logs (archivo,tipo,descripcion,accion_realizada,usuario,detalle) VALUES (?,?,?,?,?,?)");
    $desc = "Intento de guardar cambios pero la comprobación de sintaxis falló";
    $acc = "No guardado - lint falló";
    $user = $_SESSION['usuario'];
    $stmt->bind_param("ssssss", $file, $tipo='error', $desc, $acc, $user, $lint_output);
    $stmt->execute();

    die("Error de sintaxis detectado. Cambios no guardados. Detalle: ".htmlspecialchars($lint_output));
} else {
    // sobrescribir
    if(false === file_put_contents($path, $content)){
        die("No se pudo escribir el archivo");
    }
    // registrar en DB
    $stmt = $conn->prepare("INSERT INTO supervisor_logs (archivo,tipo,descripcion,accion_realizada,usuario,detalle) VALUES (?,?,?,?,?,?)");
    $desc = "Archivo actualizado manualmente por admin";
    $acc = "Guardado con éxito";
    $user = $_SESSION['usuario'];
    $stmt->bind_param("ssssss", $file, $tipo='fix', $desc, $acc, $user, $lint_output);
    $stmt->execute();

    header("Location: diagnostico.php?m=".urlencode("Archivo guardado correctamente: $file"));
    exit();
}
