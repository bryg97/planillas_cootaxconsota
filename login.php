<?php
// ==========================
// Configuración de sesión segura
// ==========================
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

// Si ya hay una sesión activa, redirigir al panel
if (isset($_SESSION['usuario'])) {
    header("Location: panel.php");
    exit();
}

// ==========================
// Configuración externa y logs
// ==========================
include __DIR__ . '/config_planillas/config.php';
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');
error_reporting(E_ALL);

// ==========================
// Generar y validar CSRF
// ==========================
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
function csrf_input() {
    return '<input type="hidden" name="csrf_token" value="'.htmlspecialchars($_SESSION['csrf_token']).'">';
}
function validate_csrf() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['csrf_token'] ?? '';
        if (!hash_equals($_SESSION['csrf_token'], $token)) {
            die("Error CSRF: token inválido");
        }
    }
}

// ==========================
// Procesar login
// ==========================
$error = "";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    validate_csrf();

    $user = trim($_POST['user'] ?? '');
    $pass = trim($_POST['pass'] ?? '');

    if (!empty($user) && !empty($pass)) {
        $stmt = $conn->prepare("SELECT id, usuario, clave, rol FROM usuarios WHERE usuario = ? LIMIT 1");
        $stmt->bind_param("s", $user);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            if (password_verify($pass, $row['clave'])) {
                // Credenciales correctas → iniciar sesión
                session_regenerate_id(true);
                $_SESSION['usuario'] = $row['usuario'];
                $_SESSION['rol'] = $row['rol'];
                $_SESSION['id_usuario'] = $row['id'];
                $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];
                $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];

                header("Location: panel.php");
                exit();
            } else {
                $error = "Usuario o contraseña incorrectos.";
            }
        } else {
            $error = "Usuario o contraseña incorrectos.";
        }
        $stmt->close();
    } else {
        $error = "Por favor completa todos los campos.";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>🚖 Sistema de Planillas</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body {
    background: #fff;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Segoe UI', sans-serif;
}
.login-card {
    width: 400px;
    padding: 2rem;
    border-radius: 15px;
    background: #ffffff;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}
.logo {
    text-align: center;
    margin-bottom: 1rem;
}
.logo img {
    max-width: 150px;
}
.btn-login {
    background-color: #ff0000;
    color: white;
    font-weight: bold;
}
.btn-login:hover {
    background-color: #cc0000;
}
.toggle-password {
    cursor: pointer;
    user-select: none;
    color: #007bff;
}
</style>
</head>
<body>
<div class="login-card">
    <div class="logo">
        <img src="https://cootaxconsota.com/wp-content/uploads/2024/07/logo-empresa-png2-1.png" alt="Logo Empresa">
    </div>
    <h4 class="text-center mb-3">🚖 Sistema de Planillas</h4>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger text-center"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>

    <form method="POST" autocomplete="off">
        <?= csrf_input() ?>
        <div class="mb-3">
            <label class="form-label">Usuario</label>
            <input type="text" name="user" class="form-control" required autofocus>
        </div>
        <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <div class="input-group">
                <input type="password" name="pass" id="password" class="form-control" required>
                <span class="input-group-text toggle-password" onclick="togglePassword()">👁</span>
            </div>
        </div>
        <button type="submit" class="btn btn-login w-100 mt-3">Ingresar</button>
    </form>
</div>

<script>
function togglePassword() {
    const passField = document.getElementById('password');
    passField.type = passField.type === 'password' ? 'text' : 'password';
}
</script>
</body>
</html>
