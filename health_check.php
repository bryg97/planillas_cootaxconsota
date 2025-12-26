<?php
// health_check.php
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include 'config.php';
if(!isset($_SESSION['rol']) || $_SESSION['rol']!=='admin'){ header("Location: login.php"); exit(); }

$report = [];
function rpush(&$report,$level,$msg){ $report[] = ['level'=>$level,'msg'=>$msg]; }

// 1) verificar archivos críticos
$files = ['login.php','panel.php','logout.php','operaciones.php','planillas.php','usuarios.php','recargas.php','liquidaciones.php','cartera.php','reportes.php','configuracion.php','diagnostico.php'];
foreach($files as $f){
    $path = __DIR__ . '/' . $f;
    if(file_exists($path)) rpush($report,'ok',"Archivo encontrado: $f");
    else rpush($report,'error',"Falta archivo: $f");
}

// 2) verificar tablas esenciales
$needed = ['usuarios','vehiculos','planillas','configuracion','auditoria_ia','supervisor_logs'];
foreach($needed as $t){
    $r = $conn->query("SHOW TABLES LIKE '".$conn->real_escape_string($t)."'");
    if($r && $r->num_rows>0) rpush($report,'ok',"Tabla existe: $t");
    else {
        rpush($report,'warning',"Tabla falta y será creada: $t");
        // crear tablas mínimas si faltan (evitar sobrescribir)
        if($t === 'usuarios'){
            $conn->query("CREATE TABLE IF NOT EXISTS usuarios (id INT AUTO_INCREMENT PRIMARY KEY, usuario VARCHAR(100) UNIQUE, clave VARCHAR(255), rol ENUM('admin','tesorera','operador') DEFAULT 'operador', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;");
            rpush($report,'fix',"Tabla usuarios creada (si no existía).");
        }
        if($t === 'vehiculos'){
            $conn->query("CREATE TABLE IF NOT EXISTS vehiculos (id INT AUTO_INCREMENT PRIMARY KEY, codigo_vehiculo VARCHAR(20) UNIQUE, placa VARCHAR(20), saldo DECIMAL(12,2) DEFAULT 0.00, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;");
            rpush($report,'fix',"Tabla vehiculos creada.");
        }
        if($t === 'planillas'){
            $conn->query("CREATE TABLE IF NOT EXISTS planillas (id INT AUTO_INCREMENT PRIMARY KEY, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, vehiculo_id INT, conductor VARCHAR(150), cedula_conductor VARCHAR(50), operador_id INT, tipo ENUM('credito','debito','efectivo') DEFAULT 'efectivo', ciudad_origen VARCHAR(100), ciudad_destino VARCHAR(100), valor DECIMAL(12,2) DEFAULT 20000.00, numero_planilla INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;");
            rpush($report,'fix',"Tabla planillas creada.");
        }
        if($t === 'configuracion'){
            $conn->query("CREATE TABLE IF NOT EXISTS configuracion (id INT AUTO_INCREMENT PRIMARY KEY, valor_base DECIMAL(12,2) DEFAULT 20000.00, telegram_token VARCHAR(255), telegram_chatid VARCHAR(255)) ENGINE=InnoDB;");
            rpush($report,'fix',"Tabla configuracion creada.");
        }
        if($t === 'auditoria_ia'){
            $conn->query("CREATE TABLE IF NOT EXISTS auditoria_ia (id INT AUTO_INCREMENT PRIMARY KEY, archivo VARCHAR(255), estado VARCHAR(50), detalles TEXT, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;");
            rpush($report,'fix',"Tabla auditoria_ia creada.");
        }
        if($t === 'supervisor_logs'){
            $conn->query("CREATE TABLE IF NOT EXISTS supervisor_logs (id INT AUTO_INCREMENT PRIMARY KEY, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, archivo VARCHAR(255), tipo ENUM('error','warning','fix'), descripcion TEXT, accion_realizada TEXT, usuario VARCHAR(100), detalle TEXT) ENGINE=InnoDB;");
            rpush($report,'fix',"Tabla supervisor_logs creada.");
        }
    }
}

// 3) asegurar modulos y permisos base (crea modulos/permisos_por_rol si faltan)
$conn->query("CREATE TABLE IF NOT EXISTS modulos (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(50), ruta VARCHAR(100)) ENGINE=InnoDB;");
$conn->query("CREATE TABLE IF NOT EXISTS permisos_por_rol (id INT AUTO_INCREMENT PRIMARY KEY, rol VARCHAR(50), modulo_id INT, permitido TINYINT(1) DEFAULT 0, FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE) ENGINE=InnoDB;");

$default_mods = [
  ['Operaciones','operaciones.php'],
  ['Planillas','planillas.php'],
  ['Cartera','cartera.php'],
  ['Liquidaciones','liquidaciones.php'],
  ['Recargas Débito','recargas.php'],
  ['Usuarios','usuarios.php'],
  ['Reportes','reportes.php'],
  ['Auditoría','auditoria.php'],
  ['Depuración','depuracion.php']
];

foreach($default_mods as $m){
    $stmt = $conn->prepare("SELECT id FROM modulos WHERE ruta=? LIMIT 1");
    $stmt->bind_param("s",$m[1]); $stmt->execute(); $res = $stmt->get_result();
    if($res->num_rows == 0){
        $stmt2 = $conn->prepare("INSERT INTO modulos (nombre,ruta) VALUES (?,?)");
        $stmt2->bind_param("ss",$m[0],$m[1]); $stmt2->execute();
        rpush($report,'fix',"Módulo creado: {$m[0]} ({$m[1]})");
    } else {
        rpush($report,'ok',"Módulo existe: {$m[0]}");
    }
}

// 4) asegurar al menos un admin (Brayan)
$r = $conn->query("SELECT id FROM usuarios WHERE usuario='Brayan' LIMIT 1");
if($r && $r->num_rows==0){
    $hash = password_hash('Admin2025!', PASSWORD_BCRYPT);
    $stmt = $conn->prepare("INSERT INTO usuarios (usuario, clave, rol) VALUES (?,?, 'admin')");
    $stmt->bind_param("ss", $user='Brayan', $hash);
    $stmt->execute();
    rpush($report,'fix',"Usuario admin 'Brayan' creado con contraseña temporal Admin2025!");
} else {
    rpush($report,'ok',"Usuario 'Brayan' ya existe.");
}

// resultado
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Health Check</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Supervisor IA v2 — Health Check</h3>
<table class="table"><thead><tr><th>Tipo</th><th>Mensaje</th></tr></thead><tbody>
<?php foreach($report as $r): ?>
<tr><td><?= $r['level'] ?></td><td><?= htmlspecialchars($r['msg']) ?></td></tr>
<?php endforeach; ?>
</tbody></table>
</body></html>
