<?php
// ==========================
// Sesión segura con expiración
// ==========================

// Configuración de cookies segura
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => $_SERVER['HTTP_HOST'],
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

// Tiempo máximo de sesión en segundos (6 horas)
$duracion_sesion = 6 * 60 * 60;

// Inicializar marcador de tiempo si no existe
if (!isset($_SESSION['inicio_sesion'])) {
    $_SESSION['inicio_sesion'] = time();
}

// Calcular tiempo transcurrido
$tiempo_transcurrido = time() - $_SESSION['inicio_sesion'];

// Verificar expiración solo para operadores
if (($_SESSION['rol'] ?? '') === 'operador' && $tiempo_transcurrido > $duracion_sesion) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    header("Location: login.php?expirada=1");
    exit();
}

// Tiempo restante en segundos para contador
$tiempo_restante = $duracion_sesion - $tiempo_transcurrido;
if ($tiempo_restante < 0) $tiempo_restante = 0;

// Validar si hay usuario logueado
if (!isset($_SESSION['usuario'])) {
    header("Location: login.php");
    exit();
}

$usuario = $_SESSION['usuario'];
$rol = $_SESSION['rol'] ?? 'operador';
?>
