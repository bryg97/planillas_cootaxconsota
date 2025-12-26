<?php
// depuracion_financiera.php
// Recalcula saldos y marca planillas pagadas según regla:
//  - crédito o débito consume saldo disponible primero.
//  - si saldo >= valor -> pagada = 1 (se descuenta valor).
//  - si saldo < valor -> pagada = 0 (se descuenta valor y saldo queda negativo).
// Modo: por defecto "simulación". Para aplicar cambios usar botón Ejecutar (commit).
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

session_start();
include __DIR__ . '/../../config_planillas/config.php';
date_default_timezone_set('America/Bogota');

if(!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin'){
    die("Acceso denegado. Solo admin puede ejecutar esta depuración.");
}

// Seguridad: pedir confirmación en formulario
$action = $_POST['action'] ?? ''; // 'dry' or 'commit'
$dryRun = ($action !== 'commit');

$now = date('Y-m-d H:i:s');

// Crear tablas de apoyo si no existen
$conn->query("
CREATE TABLE IF NOT EXISTS depuracion_financiera_backup_saldos (
  vehiculo_id INT NOT NULL,
  old_saldo DECIMAL(14,2) NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

$conn->query("
CREATE TABLE IF NOT EXISTS depuracion_financiera_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accion VARCHAR(50),
  detalles TEXT,
  usuario VARCHAR(100),
  created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

// Helper: fetch events (planillas active, planillas_historial, recargas_debito)
$events_sql = "
SELECT id AS ev_id, fecha, vehiculo_id, tipo AS ev_type, valor, 'planilla' AS source, id AS planilla_id
FROM planillas
UNION ALL
SELECT id AS ev_id, fecha, vehiculo_id, tipo AS ev_type, valor, 'planilla_hist' AS source, id AS planilla_id
FROM planillas_historial
UNION ALL
SELECT id AS ev_id, fecha, vehiculo_id, 'recarga' AS ev_type, valor, 'recarga' AS source, NULL AS planilla_id
FROM recargas_debito
ORDER BY fecha ASC, ev_id ASC
";

$events_res = $conn->query($events_sql);
if(!$events_res){
    die("Error al obtener eventos: " . $conn->error);
}

// Build events grouped by vehiculo_id
$events_by_vehicle = [];
while($e = $events_res->fetch_assoc()){
    $vid = intval($e['vehiculo_id']);
    if(!isset($events_by_vehicle[$vid])) $events_by_vehicle[$vid] = [];
    $events_by_vehicle[$vid][] = $e;
}

// Prepare result structures
$report = []; // per-vehicle report
$total_changes = 0;

// START simulation or commit
if(!$dryRun){
    $conn->begin_transaction();
    // backup current saldos
    $veh_q = $conn->query("SELECT id, saldo FROM vehiculos");
    while($v = $veh_q->fetch_assoc()){
        $vid = intval($v['id']);
        $old = floatval($v['saldo']);
        $stmt = $conn->prepare("INSERT INTO depuracion_financiera_backup_saldos (vehiculo_id, old_saldo, created_at) VALUES (?,?,?)");
        $stmt->bind_param("ids", $vid, $old, $now);
        $stmt->execute();
        $stmt->close();
        // reset saldo a 0
        $conn->query("UPDATE vehiculos SET saldo = 0 WHERE id = $vid");
    }
} else {
    // Dry run: collect current saldos to simulate on
    $veh_q = $conn->query("SELECT id, saldo FROM vehiculos");
    while($v = $veh_q->fetch_assoc()){
        $vid = intval($v['id']);
        $report[$vid] = [
            'initial_saldo' => floatval($v['saldo']),
            'final_saldo' => floatval($v['saldo']), // will simulate changes on a copy
            'events' => []
        ];
    }
}

// If dryRun and report didn't include vehicles present in events, initialize them
foreach(array_keys($events_by_vehicle) as $vid){
    if(!isset($report[$vid])){
        $init = $conn->query("SELECT saldo FROM vehiculos WHERE id=$vid")->fetch_assoc();
        $initial = $init ? floatval($init['saldo']) : 0.0;
        $report[$vid] = ['initial_saldo'=>$initial,'final_saldo'=>$initial,'events'=>[]];
    }
}

// For commit mode we also need to track current saldo per vehicle (we set to 0 above)
if(!$dryRun){
    $currSaldo = [];
    $veh_q = $conn->query("SELECT id, saldo FROM vehiculos");
    while($v = $veh_q->fetch_assoc()){
        $currSaldo[intval($v['id'])] = floatval($v['saldo']); // should be 0
    }
}

// Process events per vehicle in chronological order
foreach($events_by_vehicle as $veh_id => $events){
    if($dryRun){
        $saldo = $report[$veh_id]['final_saldo'];
    } else {
        $saldo = $currSaldo[$veh_id] ?? 0.0;
    }

    $vehicle_report = [];
    foreach($events as $ev){
        $ev_type = $ev['ev_type']; // 'credito', 'debito', 'efectivo', or 'recarga'
        $valor = floatval($ev['valor']);
        $planilla_id = $ev['planilla_id'] ? intval($ev['planilla_id']) : null;
        $fecha = $ev['fecha'];
        $source = $ev['source'];

        $row = [
            'fecha'=>$fecha,
            'source'=>$source,
            'ev_type'=>$ev_type,
            'planilla_id'=>$planilla_id,
            'valor'=>$valor,
            'saldo_before'=>$saldo,
            'saldo_after'=>null,
            'action'=>null
        ];

        if($ev_type === 'recarga'){
            // increase saldo
            $saldo += $valor;
            $row['saldo_after'] = $saldo;
            $row['action'] = "Recarga +".number_format($valor,2,'.','');
            // If commit -> maybe insert a record in recargas_debito? (we assume recargas already present)
        } else {
            // planilla: tipo = credito|debito|efectivo — we only treat credito/debito as affecting saldo
            if($ev_type === 'credito' || $ev_type === 'debito'){
                // rule: consume saldo first
                if($saldo >= $valor){
                    // covered by saldo => mark pagada = 1
                    $saldo -= $valor;
                    $row['saldo_after'] = $saldo;
                    $row['action'] = "Planilla #{$planilla_id} cubierta por saldo -> pagada=1";
                    if(!$dryRun){
                        // update pagada in the table where this planilla lives (planillas or planillas_historial)
                        // prefer planillas (active) first
                        $found = $conn->query("SELECT id FROM planillas WHERE id=$planilla_id")->fetch_assoc();
                        if($found){
                            $conn->query("UPDATE planillas SET pagada=1 WHERE id=$planilla_id");
                        } else {
                            $conn->query("UPDATE planillas_historial SET pagada=1 WHERE id=$planilla_id");
                        }
                    }
                } else {
                    // not enough -> subtract (can go negative), pagada = 0 (debt)
                    $saldo -= $valor;
                    $row['saldo_after'] = $saldo;
                    $row['action'] = "Planilla #{$planilla_id} no cubierta -> pagada=0 (deuda)";
                    if(!$dryRun){
                        $found = $conn->query("SELECT id FROM planillas WHERE id=$planilla_id")->fetch_assoc();
                        if($found){
                            $conn->query("UPDATE planillas SET pagada=0 WHERE id=$planilla_id");
                        } else {
                            $conn->query("UPDATE planillas_historial SET pagada=0 WHERE id=$planilla_id");
                        }
                    }
                }
            } else {
                // tipo 'efectivo' -> does NOT affect saldo
                $row['saldo_after'] = $saldo;
                $row['action'] = "Planilla #{$planilla_id} (efectivo) - no afecta saldo";
                // but ensure pagada remains as-is (efectivo handled by liquidaciones flow)
            }
        }

        $vehicle_report[] = $row;
    } // end events loop

    // Save results to report structures
    if($dryRun){
        $report[$veh_id]['events'] = $vehicle_report;
        $report[$veh_id]['final_saldo'] = $saldo;
    } else {
        // commit: update vehiculos.saldo to final
        $conn->query("UPDATE vehiculos SET saldo = ".floatval($saldo)." WHERE id = ".intval($veh_id));
        $total_changes++;
    }
}

// If commit, commit transaction and write a summary log
if(!$dryRun){
    $conn->commit();
    $detail = "Depuración financiera ejecutada por {$_SESSION['usuario']} - vehículos actualizados: $total_changes";
    $stmt = $conn->prepare("INSERT INTO depuracion_financiera_logs (accion, detalles, usuario, created_at) VALUES (?, ?, ?, ?)");
    $accion = "depuracion_commit";
    $stmt->bind_param("ssss", $accion, $detail, $_SESSION['usuario'], $now);
    $stmt->execute();
    $stmt->close();
}

// Output result (HTML)
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Depuración Financiera</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="p-4">
<a href="panel.php" class="btn btn-secondary mb-3">⬅ Panel</a>
<h3>Depuración Financiera — <?= $dryRun ? "SIMULACIÓN" : "EJECUTADA" ?></h3>

<?php if($dryRun): ?>
  <div class="alert alert-info">
    <strong>Modo simulación:</strong> No se realizaron cambios. Revise el informe y, si todo está OK, vuelva y presione <em>Ejecutar (commit)</em>.
  </div>
<?php else: ?>
  <div class="alert alert-success">
    Depuración aplicada correctamente. Se actualizaron saldos y estados. Revisa auditoría/logs para detalles.
  </div>
<?php endif; ?>

<form method="POST" onsubmit="return confirm('Esto afectará saldos y estados. ¿Continuar?');" class="mb-3">
  <button name="action" value="dry" class="btn btn-outline-primary" type="submit">Simular (dry run)</button>
  <button name="action" value="commit" class="btn btn-danger" type="submit">Ejecutar (commit)</button>
</form>

<?php if($dryRun): ?>
  <h5>Resumen por vehículo (simulación)</h5>
  <?php foreach($report as $vid => $r): ?>
    <div class="card mb-3">
      <div class="card-header"><strong>Vehículo ID <?=$vid?></strong> — Saldo inicial: <?=number_format($r['initial_saldo'],2,',','.')?> — Saldo final (simulado): <?=number_format($r['final_saldo'],2,',','.')?></div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead><tr><th>Fecha</th><th>Evento</th><th>Planilla</th><th>Valor</th><th>Saldo antes</th><th>Saldo después</th><th>Acción</th></tr></thead>
          <tbody>
          <?php foreach($r['events'] as $ev): ?>
            <tr>
              <td><?=htmlspecialchars($ev['fecha'])?></td>
              <td><?=htmlspecialchars($ev['source']."/".$ev['ev_type'])?></td>
              <td><?=htmlspecialchars($ev['planilla_id'] ?? '')?></td>
              <td><?=number_format($ev['valor'],2,',','.')?></td>
              <td><?=number_format($ev['saldo_before'],2,',','.')?></td>
              <td><?=number_format($ev['saldo_after'],2,',','.')?></td>
              <td><?=htmlspecialchars($ev['action'])?></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  <?php endforeach; ?>
<?php else: ?>
  <p>Depuración aplicada. Se crearon respaldos parciales en <code>depuracion_financiera_backup_saldos</code>. Logs en <code>depuracion_financiera_logs</code>.</p>
<?php endif; ?>

</body></html>
