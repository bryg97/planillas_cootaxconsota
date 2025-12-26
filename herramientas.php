<?php
session_start();
if (!isset($_SESSION['usuario'])) {
  header("Location: login.php");
  exit();
}
$usuario = $_SESSION['usuario'];
$rol = $_SESSION['rol'];
date_default_timezone_set('America/Bogota');
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Herramientas — Cootaxconsota</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
<style>
body { background-color: #f8f9fa; }
.container { margin-top: 50px; max-width: 600px; }
.resultado { font-size: 1.2rem; margin-top: 15px; }
</style>
</head>
<body>
<div class="container">
  <h3 class="mb-4"><i class="bi bi-wrench"></i> Herramientas — Calculadora de Horas</h3>

  <form id="form-calculadora" class="p-4 bg-white rounded shadow-sm">
    <div class="mb-3">
      <label for="horaInicio" class="form-label">Hora de inicio</label>
      <input type="time" id="horaInicio" class="form-control" required>
    </div>
    <div class="mb-3">
      <label for="horaFin" class="form-label">Hora de fin</label>
      <input type="time" id="horaFin" class="form-control" required>
    </div>
    <button type="button" class="btn btn-primary w-100" onclick="calcularHoras()">Calcular</button>

    <div id="resultado" class="resultado text-center mt-3"></div>
  </form>

  <a href="panel.php" class="btn btn-link mt-4"><i class="bi bi-arrow-left"></i> Volver al panel</a>
</div>

<script>
// ========== 🔢 CÁLCULO PRINCIPAL ==========
function calcularHoras() {
  const inicio = document.getElementById('horaInicio').value;
  const fin = document.getElementById('horaFin').value;

  if (!inicio || !fin) {
    document.getElementById('resultado').innerHTML = '<span class="text-danger">Por favor ingrese ambas horas.</span>';
    return;
  }

  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);

  let inicioMin = h1 * 60 + m1;
  let finMin = h2 * 60 + m2;

  if (finMin < inicioMin) finMin += 24 * 60;

  const totalMin = finMin - inicioMin;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;

  let valorServicio = horas * 30000;
  if (minutos > 40) valorServicio += 30000;

  document.getElementById('resultado').innerHTML = `
    <div class="alert alert-info">
      <strong>Duración:</strong> ${horas}h ${minutos}min<br>
      <strong>Valor total:</strong> $${valorServicio.toLocaleString()}
    </div>
  `;

  hablarResultado("<?= htmlspecialchars($usuario) ?>", horas, minutos, valorServicio);
}

// ========== 🎤 TEXTO A VOZ (voz juvenil) ==========
function hablarTexto(texto) {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = 'es-CO';
  utter.rate = 1.15; // un poco más rápido
  utter.pitch = 1.3; // tono alegre
  utter.volume = 1;

  const seleccionarVoz = () => {
    const voces = synth.getVoices();
    const preferidas = [
      'Google español de Latinoamérica',
      'Google español',
      'Microsoft Dalia Online (Natural)',
      'Microsoft Helena Online (Natural)',
      'Microsoft Sabina Online (Natural)'
    ];
    let vozElegida = voces.find(v => preferidas.includes(v.name)) || voces.find(v => v.lang.startsWith('es'));
    if (vozElegida) utter.voice = vozElegida;
    synth.speak(utter);
  };

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = seleccionarVoz;
  } else {
    seleccionarVoz();
  }
}

// ========== 🗣️ RESULTADO ==========
function hablarResultado(usuario, horas, minutos, valor) {
  const valorPesos = valor.toLocaleString('es-CO');
  const mensaje = `${usuario}, el tiempo total es ${horas} ${horas === 1 ? 'hora' : 'horas'} 
                   y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.
                   El valor total del servicio es ${valorPesos} pesos.`;
  hablarTexto(mensaje);
}

// ========== 👋 SALUDO AUTOMÁTICO ==========
window.addEventListener('load', () => {
  const usuario = "<?= htmlspecialchars($usuario) ?>";
  const saludo = `¡Hola ${usuario}! Me alegra verte de nuevo.`;
  setTimeout(() => hablarTexto(saludo), 1000);
});
</script>
</body>
</html>
