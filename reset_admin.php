<?php
include 'config.php';
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Usuario y nueva contraseña
$usuario = 'Brayan';
$nuevaClave = 'Admin2025!';
$hash = password_hash($nuevaClave, PASSWORD_DEFAULT);

$sql = "UPDATE usuarios SET clave='$hash', rol='admin' WHERE usuario='$usuario'";
if ($conn->query($sql)) {
    echo "✅ Contraseña de '$usuario' restablecida correctamente. Nueva clave: $nuevaClave";
} else {
    echo "❌ Error: " . $conn->error;
}
?>
