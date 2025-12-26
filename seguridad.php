<?php
// seguridad.php — protección de sesión y CSRF

// ==========================
// Iniciar sesión segura
// ==========================
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => 'pvo.cootaxconsota.com', // subdominio fijo
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

// ==========================
// Validar usuario logueado
// ==========================
if (!isset($_SESSION['usuario'])) {
    header('Location: login.php');
    exit();
}

// ==========================
// Validación de IP y User Agent
// ==========================
if (
    isset($_SESSION['ip'], $_SESSION['user_agent']) &&
    ($_SESSION['ip'] !== $_SERVER['REMOTE_ADDR'] ||
     $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT'])
) {
    // Datos inconsistentes → cerrar sesión
    session_unset();
    session_destroy();
    header('Location: login.php');
    exit();
}

// ==========================
// Generar/validar CSRF
// ==========================
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Función para validar CSRF en formularios POST
function validar_csrf() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['csrf_token'] ?? '';
        if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
            die('❌ Error CSRF: acción no permitida.');
        }
    }
}

// ==========================
// Función para cerrar sesión segura
// ==========================
function logout_seguro() {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            'pvo.cootaxconsota.com',
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();
    header('Location: login.php');
    exit();
}

// ==========================
// Registros opcionales de seguridad
// ==========================
/*
Ejemplo: registrar intentos fallidos o accesos sospechosos
$log_file = __DIR__ . '/../../logs/seguridad.log';
$mensaje = date('Y-m-d H:i:s') . " - Usuario: " . ($_SESSION['usuario'] ?? 'Invitado') . " - IP: " . $_SERVER['REMOTE_ADDR'] . PHP_EOL;
file_put_contents($log_file, $mensaje, FILE_APPEND | LOCK_EX);
*/
