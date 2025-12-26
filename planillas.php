<?php
// ================== BLOQUE DE SEGURIDAD INICIAL ==================
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

if(!isset($_SESSION['usuario'])){
    header("Location: login.php");
    exit();
}

// Validar IP y User Agent
if(isset($_SESSION['ip']) && $_SESSION['ip'] !== $_SERVER['REMOTE_ADDR']) exit('Sesión inválida');
if(isset($_SESSION['user_agent']) && $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) exit('Sesión inválida');

// Generar token CSRF si no existe
if(empty($_SESSION['csrf_token'])){
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Función para validar token CSRF
function validarCSRF($token){
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
// ================== FIN BLOQUE DE SEGURIDAD ==================

ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

include __DIR__ . '/../../config_planillas/config.php';
date_default_timezone_set('America/Bogota');

$rol = $_SESSION['rol'];
$usuario = $_SESSION['usuario'] ?? '';
$user_id = $_SESSION['id_usuario'] ?? null;

// obtén credenciales telegram
$cfg = $conn->query("SELECT telegram_token, telegram_chatid FROM configuracion LIMIT 1")->fetch_assoc();
$telegram_token = $cfg['telegram_token'] ?? '';
$telegram_chatid = $cfg['telegram_chatid'] ?? '';

// helper enviar telegram (Markdown)
function enviarTelegram($token, $chatid, $texto){
    if(empty($token) || empty($chatid)) return false;
    $post = [
      'chat_id' => $chatid,
      'text' => $texto,
      'parse_mode' => 'Markdown'
    ];
    $url = "https://api.telegram.org/bot$token/sendMessage";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

// helper para escapar solo contenido de variables, no asteriscos para Markdown
function escapeTelegramText($text){
    return str_replace(
        ['_', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'],
        ['\_', '\[','\]','\(','\)','\~','\`','\>','\#','\+','\-','\=','\|','\{','\}','\.','!'],
        $text
    );
}

// Mensajes
$ok = '';
$error = '';

// ================== PROCESAR FORMULARIOS POST ==================
if($_SERVER['REQUEST_METHOD'] === 'POST'){
    if(!validarCSRF($_POST['csrf_token'] ?? '')){
        die("CSRF inválido");
    }

    // Eliminar (admin)
    if(isset($_POST['eliminar']) && $rol === 'admin'){
        $id = intval($_POST['id']);
        $conn->begin_transaction();
        try{
            $conn->query("DELETE FROM liquidaciones WHERE planilla_id = $id");
            $conn->query("DELETE FROM planillas WHERE id = $id");
            $detalle = "Admin ".$conn->real_escape_string($usuario)." eliminó planilla ID $id.";
            $conn->query("INSERT INTO auditoria (usuario, accion, detalles) VALUES ('".$conn->real_escape_string($usuario)."','Eliminar planilla','".$conn->real_escape_string($detalle)."')");
            $conn->commit();
            $ok = "Planilla eliminada.";
        }catch(Exception $e){
            $conn->rollback();
            $error = "No se pudo eliminar: " . $e->getMessage();
        }
    }

    // Editar (admin)
    if(isset($_POST['editar_planilla']) && $rol === 'admin'){
        $id = intval($_POST['id']);
        $conductor = $conn->real_escape_string(trim($_POST['conductor'] ?? ''));
        $cedula = $conn->real_escape_string(trim($_POST['cedula_conductor'] ?? ''));
        $ciudad_origen = $conn->real_escape_string(trim($_POST['ciudad_origen'] ?? ''));
        $ciudad_destino = $conn->real_escape_string(trim($_POST['ciudad_destino'] ?? ''));
        $numero_planilla = $conn->real_escape_string(trim($_POST['numero_planilla'] ?? ''));
        $nuevo_tipo = $conn->real_escape_string(trim($_POST['tipo'] ?? ''));
        $fecha = $_POST['fecha'] ?? '';

        $orig = $conn->query("SELECT * FROM planillas WHERE id = $id")->fetch_assoc();
        if(!$orig){
            $error = "Planilla no encontrada.";
        } else {
            $tipo_antiguo = $orig['tipo'];
            $conn->begin_transaction();
            try{
                $q_up = "UPDATE planillas SET 
                            conductor = '". $conductor ."',
                            cedula_conductor = ".($cedula === '' ? "NULL" : "'$cedula'").",
                            ciudad_origen = ".($ciudad_origen === '' ? "NULL" : "'$ciudad_origen'").",
                            ciudad_destino = ".($ciudad_destino === '' ? "NULL" : "'$ciudad_destino'").",
                            numero_planilla = '". $numero_planilla ."',
                            tipo = '". $nuevo_tipo ."',
                            fecha = ".($fecha === '' ? "NOW()" : "'$fecha'")."
                         WHERE id = $id";
                $conn->query($q_up);

                if($tipo_antiguo !== $nuevo_tipo){
                    if($nuevo_tipo === 'efectivo'){
                        $conn->query("DELETE FROM liquidaciones WHERE planilla_id = $id");
                        $conn->query("INSERT IGNORE INTO liquidaciones (planilla_id, operador_id, estado, created_at) VALUES ($id, $user_id, 'pendiente', NOW())");
                        $conn->query("UPDATE planillas SET pagada = 0 WHERE id = $id");
                    } else {
                        $conn->query("DELETE FROM liquidaciones WHERE planilla_id = $id");
                        $conn->query("UPDATE planillas SET pagada = 0 WHERE id = $id");
                    }
                }

                $detalle = "Admin ".$conn->real_escape_string($usuario)." editó planilla ID $id. Tipo: $tipo_antiguo → $nuevo_tipo.";
                $conn->query("INSERT INTO auditoria (usuario,accion,detalles) VALUES ('".$conn->real_escape_string($usuario)."','Editar planilla','". $conn->real_escape_string($detalle) ."')");
                $conn->commit();
                $ok = "Planilla actualizada correctamente.";

                // enviar Telegram
                if(!empty($telegram_token) && !empty($telegram_chatid)){
                    $vehRow = $conn->query("SELECT v.codigo_vehiculo FROM planillas p LEFT JOIN vehiculos v ON p.vehiculo_id=v.id WHERE p.id = $id")->fetch_assoc();
                    $codigo = $vehRow['codigo_vehiculo'] ?? '-';
                    $fecha_msg = date("d/m/Y h:i a", strtotime($fecha ?: $orig['fecha']));
                    $msg = "✏️ *Planilla editada por ADMIN*\n";
                    $msg .= "👤 Admin: *". escapeTelegramText($usuario) ."*\n";
                    $msg .= "🚕 Vehículo: *". escapeTelegramText($codigo) ."*\n";
                    $msg .= "🧑 Conductor: *". escapeTelegramText($conductor) ."* (CC ". escapeTelegramText($cedula?:'-') .")\n";
                    $msg .= "🌍 Origen: ". escapeTelegramText($ciudad_origen?:'-') ."\n";
                    $msg .= "🏁 Destino: ". escapeTelegramText($ciudad_destino?:'-') ."\n";
                    $msg .= "🔢 N° Planilla: ". escapeTelegramText($numero_planilla) ."\n";
                    $msg .= "🔁 Tipo: *". strtoupper($tipo_antiguo) ." → ". strtoupper($nuevo_tipo) ."*\n";
                    $msg .= "🕒 Fecha cambio: _".$fecha_msg."_";
                    enviarTelegram($telegram_token, $telegram_chatid, $msg);
                }

            } catch(Exception $e){
                $conn->rollback();
                $error = "No se pudo editar: ".$e->getMessage();
            }
        }
    }
}
// ================== FIN POST ==================

// listado planillas
$res = $conn->query("SELECT p.*, v.codigo_vehiculo, u.usuario AS operador FROM planillas p LEFT JOIN vehiculos v ON p.vehiculo_id=v.id LEFT JOIN usuarios u ON p.operador_id = u.id ORDER BY p.fecha DESC");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Planillas registradas</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Planillas registradas</h3>

<?php if($ok): ?><div class="alert alert-success"><?=htmlspecialchars($ok)?></div><?php endif; ?>
<?php if($error): ?><div class="alert alert-danger"><?=htmlspecialchars($error)?></div><?php endif; ?>

<table class="table table-hover align-middle table-sm">
<thead class="table-dark">
<tr>
  <th>ID</th>
  <th>Fecha</th>
  <th>Vehículo</th>
  <th>Conductor</th>
  <th>Cédula</th>
  <th>Tipo</th>
  <th>Valor</th>
  <th>Operador</th>
  <th>N° Planilla</th>
  <?php if($rol=='admin'): ?><th>Acciones</th><?php endif; ?>
</tr>
</thead>
<tbody>
<?php while($r=$res->fetch_assoc()): ?>
<tr>
  <td><?=intval($r['id'])?></td>
  <td><?= date("d/m/Y h:i a", strtotime($r['fecha'])) ?></td>
  <td><?=htmlspecialchars($r['codigo_vehiculo'])?></td>
  <td><?=htmlspecialchars($r['conductor'])?></td>
  <td><?=htmlspecialchars($r['cedula_conductor'])?></td>
  <td><span class="badge bg-info text-dark"><?=strtoupper($r['tipo'])?></span></td>
  <td><strong><?=number_format($r['valor'],0,',','.')?></strong></td>
  <td><?=htmlspecialchars($r['operador'])?></td>
  <td><?=htmlspecialchars($r['numero_planilla'])?></td>

  <?php if($rol=='admin'): ?>
  <td>
    <!-- Editar (modal) -->
    <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal<?=$r['id']?>">Editar</button>

    <!-- Eliminar -->
    <form method="POST" style="display:inline" onsubmit="return confirm('¿Eliminar planilla?');">
      <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
      <input type="hidden" name="id" value="<?=intval($r['id'])?>">
      <button name="eliminar" class="btn btn-sm btn-danger">✖</button>
    </form>

    <!-- Modal editar -->
    <div class="modal fade" id="editModal<?=$r['id']?>" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
            <input type="hidden" name="editar_planilla" value="1">
            <input type="hidden" name="id" value="<?=intval($r['id'])?>">
            <div class="modal-header">
              <h5 class="modal-title">Editar Planilla #<?=intval($r['id'])?></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label class="form-label">Fecha</label>
                <input name="fecha" type="datetime-local" class="form-control" value="<?=date('Y-m-d\TH:i', strtotime($r['fecha']))?>" required>
              </div>
              <div class="mb-2">
                <label class="form-label">Conductor</label>
                <input name="conductor" class="form-control" value="<?=htmlspecialchars($r['conductor'])?>" required>
              </div>
              <div class="mb-2">
                <label class="form-label">Cédula conductor</label>
                <input name="cedula_conductor" class="form-control" value="<?=htmlspecialchars($r['cedula_conductor'])?>">
              </div>
              <div class="mb-2">
                <label class="form-label">Ciudad origen</label>
                <input name="ciudad_origen" class="form-control" value="<?=htmlspecialchars($r['ciudad_origen'])?>">
              </div>
              <div class="mb-2">
                <label class="form-label">Ciudad destino</label>
                <input name="ciudad_destino" class="form-control" value="<?=htmlspecialchars($r['ciudad_destino'])?>">
              </div>
              <div class="mb-2">
                <label class="form-label">N° Planilla</label>
                <input name="numero_planilla" class="form-control" value="<?=htmlspecialchars($r['numero_planilla'])?>" required>
              </div>
              <div class="mb-2">
                <label class="form-label">Tipo</label>
                <select name="tipo" class="form-select" required>
                  <option value="credito" <?= $r['tipo'] === 'credito' ? 'selected' : '' ?>>Crédito</option>
                  <option value="efectivo" <?= $r['tipo'] === 'efectivo' ? 'selected' : '' ?>>Efectivo</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" type="submit">Guardar cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </td>
  <?php endif; ?>

</tr>
<?php endwhile; ?>
</tbody>
</table>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
