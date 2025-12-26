<?php
session_start();

// Si se confirma logout
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_logout'])) {
    // Limpiar variables de sesión
    $_SESSION = [];

    // Destruir cookies de sesión
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    // Destruir sesión
    session_destroy();

    // Redirigir al login
    header("Location: login.php");
    exit();
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Logout</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4 d-flex justify-content-center align-items-center" style="height:100vh;">
<div class="card shadow-sm" style="width: 400px;">
    <div class="card-body text-center">
        <h5 class="card-title mb-3">¿Deseas cerrar sesión?</h5>
        <form method="POST">
            <input type="hidden" name="confirm_logout" value="1">
            <button type="submit" class="btn btn-danger me-2">Cerrar sesión</button>
            <a href="panel.php" class="btn btn-secondary">Cancelar</a>
        </form>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
