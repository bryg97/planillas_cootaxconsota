<?php
session_start();

if (!isset($_SESSION['usuario'])) {
    header("Location: /planillas/login.php");
    exit();
}

// Protección extra: IP y navegador
if (
    ($_SESSION['ip'] ?? '') !== $_SERVER['REMOTE_ADDR'] ||
    ($_SESSION['user_agent'] ?? '') !== $_SERVER['HTTP_USER_AGENT']
) {
    session_destroy();
    header("Location: /planillas/login.php");
    exit();
}
?>
