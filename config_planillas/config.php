<?php
// Configuración de zona horaria
date_default_timezone_set(getenv('TZ') ?: 'America/Bogota');

// Obtener variables de entorno (Vercel usa getenv)
$servername = getenv('DB_HOST') ?: 'localhost';
$username = getenv('DB_USER') ?: 'u406926550_planillas';
$password = getenv('DB_PASS') ?: '!AwbD$3k';
$dbname = getenv('DB_NAME') ?: 'u406926550_planillas';

// Conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    error_log("Error de conexión DB: " . $conn->connect_error);
    die("Error de conexión: " . $conn->connect_error);
}

// Configurar zona horaria de MySQL
$conn->query("SET time_zone = '-05:00'");
?>
