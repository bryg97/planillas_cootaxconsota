<?php
// ==========================
// panel.php — Panel de Control
// ==========================

// Zona horaria
date_default_timezone_set('America/Bogota');

// ==========================
// Sesión segura
// ==========================
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

// Duración máxima de sesión operador: 6 horas
$duracion_sesion = 6 * 60 * 60;
if (!isset($_SESSION['inicio_sesion'])) $_SESSION['inicio_sesion'] = time();
$tiempo_transcurrido = time() - $_SESSION['inicio_sesion'];

// Expiración automática
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

// Tiempo restante para contador
$tiempo_restante = max(0, $duracion_sesion - $tiempo_transcurrido);

// Validar login
if (!isset($_SESSION['usuario'])) {
    header("Location: login.php");
    exit();
}

// ==========================
// Conexión y datos usuario
// ==========================
include __DIR__ . '/config_planillas/config.php';

$usuario = $_SESSION['usuario'];
$rol = $_SESSION['rol'] ?? 'operador';

// Saludo
$hora = date('H');
if ($hora >= 6 && $hora < 12) $saludo = "Buenos días";
elseif ($hora >= 12 && $hora < 18) $saludo = "Buenas tardes";
else $saludo = "Buenas noches";

// Módulos por rol
$modulos = [];
$stmt = $conn->prepare("
    SELECT nombre, ruta 
    FROM modulos
    INNER JOIN permisos_por_rol ON permisos_por_rol.modulo_id = modulos.id
    WHERE permisos_por_rol.rol = ? AND permisos_por_rol.permitido = 1
");
$stmt->bind_param("s", $rol);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
    $row['nombre'] = htmlspecialchars($row['nombre'], ENT_QUOTES, 'UTF-8');
    $row['ruta'] = htmlspecialchars($row['ruta'], ENT_QUOTES, 'UTF-8');
    $modulos[] = $row;
}
$stmt->close();

// Iconos y colores
$iconos_modulos = [
    'Planillas'=>'bi-receipt', 'Reportes'=>'bi-bar-chart-line', 'Usuarios'=>'bi-people',
    'Vehículos'=>'bi-truck', 'Clientes'=>'bi-person-check', 'Cobros'=>'bi-currency-dollar',
    'Operaciones'=>'bi-gear-wide-connected','Cartera'=>'bi-wallet2','Liquidaciones'=>'bi-cash-stack',
    'Recargas Débito'=>'bi-credit-card-2-back','Auditoría'=>'bi-search'
];
$colores_iconos = ['#007bff','#28a745','#ffc107','#dc3545','#6610f2','#fd7e14','#20c997','#6f42c1','#e83e8c','#17a2b8','#343a40'];

// CSRF token opcional
if(empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
$csrf_token = $_SESSION['csrf_token'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Panel de Control — Cootaxconsota</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
<style>
body { background-color: #f8f9fa; }
.container { margin-top: 40px; }
.module-card { background: white; border-radius: 15px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); padding: 25px; text-align: center; transition: all .3s; }
.module-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.15); }
.module-card i { font-size: 40px; margin-bottom: 10px; transition: transform 0.3s; }
.module-card i:hover { transform: scale(1.2); }
.logout-btn { position: absolute; right: 20px; top: 15px; }
footer { text-align: center; margin-top: 40px; color: #777; }
.panel-titulo { font-size: 1.8rem; font-weight: 600; color: #0d6efd; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: space-between; gap: 15px; }
.panel-titulo-left { display: flex; align-items: center; gap: 10px; }
.panel-titulo img { width: 45px; height: 45px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: transform 0.3s, box-shadow 0.3s; }
.panel-titulo img:hover { transform: scale(1.2); box-shadow: 0 6px 14px rgba(0,0,0,0.25); }
.bienvenida { font-size: 1.1rem; margin-bottom: 20px; color: #495057; }
.usuario-nombre { font-weight: 700; color: #007bff; background: rgba(0,123,255,0.1); padding: 3px 8px; border-radius: 12px; }
</style>
</head>
<body>
<div class="container">
  <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
    <h3 class="panel-titulo">
        <span class="panel-titulo-left">
            <i class="bi bi-speedometer2"></i>
            Panel de Control — <?= htmlspecialchars(ucfirst($rol)) ?>
        </span>
        <img src="https://cootaxconsota.com/wp-content/uploads/2021/01/cropped-logo-consota-1024x1024-1.png" alt="Escudo Cootaxconsota">
    </h3>
    <a href="logout.php" class="btn btn-outline-danger logout-btn"><i class="bi bi-box-arrow-right"></i> Cerrar sesión</a>
  </div>

  <p class="bienvenida">
    <?= htmlspecialchars($saludo) ?>, 
    <span class="usuario-nombre"><?= htmlspecialchars($usuario) ?></span>
    <br>
    <small>Tiempo de sesión restante: <span id="contador"><?= gmdate("H:i:s",$tiempo_restante) ?></span></small>
  </p>

  <div class="row g-4">
    <?php if(empty($modulos) && $rol != 'admin'): ?>
      <div class="alert alert-warning">No tienes módulos asignados. Contacta al administrador.</div>
    <?php endif; ?>

    <?php
    $i = 0;
    foreach ($modulos as $mod) {
        $icono = $iconos_modulos[$mod['nombre']] ?? 'bi-folder';
        $color = $colores_iconos[$i % count($colores_iconos)];
        echo '
        <div class="col-md-3">
          <div class="module-card">
            <i class="bi '.$icono.'" style="color: '.$color.';"></i>
            <h5>'.$mod['nombre'].'</h5>
            <a href="'.$mod['ruta'].'" class="btn btn-primary btn-sm mt-2">Abrir</a>
          </div>
        </div>';
        $i++;
    }

    // Módulos adicionales para admin
    if($rol=='admin') {
        echo '
        <div class="col-md-3">
          <div class="module-card">
            <i class="bi bi-robot" style="color:#343a40;"></i>
            <h5>Supervisor IA</h5>
            <p class="small">Analiza, corrige y supervisa los archivos PHP automáticamente.</p>
            <a href="diagnostico.php?csrf='.$csrf_token.'" class="btn btn-primary btn-sm mt-2">Abrir</a>
          </div>
        </div>
        <div class="col-md-3">
          <div class="module-card">
            <i class="bi bi-gear" style="color:#6c757d;"></i>
            <h5>Configuración</h5>
            <p class="small">Parámetros, valores base y ajustes del sistema.</p>
            <a href="configuracion.php?csrf='.$csrf_token.'" class="btn btn-primary btn-sm mt-2">Abrir</a>
          </div>
        </div>';
    }
    ?>
  </div>

  <footer class="mt-5">
    <p>© <?= date("Y") ?> Cootaxconsota — Sistema de Planillas</p>
  </footer>
</div>

<script>
// Contador de sesión en tiempo real
let tiempo = <?= $tiempo_restante ?>;
function actualizarContador() {
    if(tiempo <= 0){
        clearInterval(intervalo);
        alert("La sesión ha expirado.");
        window.location.href="logout.php";
        return;
    }
    tiempo--;
    let h = Math.floor(tiempo/3600);
    let m = Math.floor((tiempo%3600)/60);
    let s = tiempo%60;
    document.getElementById("contador").textContent = 
        String(h).padStart(2,'0')+":"+String(m).padStart(2,'0')+":"+String(s).padStart(2,'0');
}
let intervalo = setInterval(actualizarContador,1000);
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
