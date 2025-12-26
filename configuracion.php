<?php
// configuracion.php (versión segura)
ini_set('display_errors',1); ini_set('display_startup_errors',1); error_reporting(E_ALL);
session_start();
include __DIR__ . '/../../config_planillas/config.php';
if(!isset($_SESSION['rol']) || $_SESSION['rol'] != 'admin'){ header("Location: login.php"); exit(); }

$mensaje = "";
$valor_base = 20000.00; $telegram_token = ""; $telegram_chatid = "";
$r = $conn->query("SELECT * FROM configuracion LIMIT 1");
if($r && $r->num_rows>0){
    $row = $r->fetch_assoc();
    $valor_base = $row['valor_base'] ?? $valor_base;
    $telegram_token = $row['telegram_token'] ?? '';
    $telegram_chatid = $row['telegram_chatid'] ?? '';
}

if(isset($_POST['guardar_valor'])){
    $nv = floatval($_POST['valor_base']);
    if($conn->query("SELECT id FROM configuracion LIMIT 1")->num_rows){
        $stmt = $conn->prepare("UPDATE configuracion SET valor_base=?");
        $stmt->bind_param("d",$nv);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("INSERT INTO configuracion (valor_base) VALUES (?)");
        $stmt->bind_param("d",$nv);
        $stmt->execute();
    }
    $mensaje = "Valor base actualizado.";
    $valor_base = $nv;
}

if(isset($_POST['guardar_telegram'])){
    $tk = trim($_POST['telegram_token']);
    $cid = trim($_POST['telegram_chatid']);
    if($conn->query("SELECT id FROM configuracion LIMIT 1")->num_rows){
        $stmt = $conn->prepare("UPDATE configuracion SET telegram_token=?, telegram_chatid=?");
        $stmt->bind_param("ss",$tk,$cid);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("INSERT INTO configuracion (telegram_token, telegram_chatid) VALUES (?,?)");
        $stmt->bind_param("ss",$tk,$cid);
        $stmt->execute();
    }
    // enviar prueba
    $ok = false; $resp = '';
    if(!empty($tk) && !empty($cid)){
        $url = "https://api.telegram.org/bot{$tk}/sendMessage";
        $msg = "Prueba: Sistema Planillas - mensaje de prueba";
        $data = ['chat_id' => $cid, 'text' => $msg];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        $resp = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if($resp && strpos($resp, '"ok":true') !== false) $ok = true;
    }
    $mensaje = $ok ? "Configuración guardada y prueba enviada." : "Configuración guardada. No se pudo enviar la prueba: " . ($resp ?: 'sin respuesta');
}
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Configuración</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Configuración</h3>
<?php if($mensaje): ?><div class="alert alert-info"><?= htmlspecialchars($mensaje) ?></div><?php endif; ?>

<div class="row">
  <div class="col-md-6">
    <form method="POST">
      <h5>Valor base de planilla</h5>
      <div class="mb-2"><input type="number" step="0.01" name="valor_base" class="form-control" value="<?= htmlspecialchars($valor_base) ?>"></div>
      <button name="guardar_valor" class="btn btn-success">Guardar</button>
    </form>
  </div>

  <div class="col-md-6">
    <form method="POST">
      <h5>Telegram (token y chat id)</h5>
      <div class="mb-2"><input name="telegram_token" class="form-control" placeholder="Bot token" value="<?= htmlspecialchars($telegram_token) ?>"></div>
      <div class="mb-2"><input name="telegram_chatid" class="form-control" placeholder="Chat ID or channel" value="<?= htmlspecialchars($telegram_chatid) ?>"></div>
      <button name="guardar_telegram" class="btn btn-info">Guardar y enviar prueba</button>
    </form>
  </div>
</div>
</body></html>
