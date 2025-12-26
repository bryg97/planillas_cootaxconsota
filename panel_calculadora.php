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
body {
  background-color: #f8f9fa;
}
.container {
  margin-top: 50px;
  max-width: 600px;
}
.resultado {
  font-size: 1.2rem;
  margin-top: 15px;
}

/* === 🤖 Agente Virtual === */
#agente-virtual {
  position: fixed;
  bottom: 20px;
  right: 20px;
  text-align: center;
  z-index: 9999;
  cursor: pointer;
}
#agente-virtual img {
  width: 85px;
  height: 85px;
  border-radius: 50%;
  border: 3px solid #007bff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  transition: transform 0.3s;
  animation: slideIn 1s ease-out;
}
#agente-virtual img:hover {
  transform: scale(1.1);
}
#agente-virtual .mensaje {
  margin-top: 5px;
  background: rgba(0,123,255,0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
  display: inline-block;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  animation: fadeIn 0.6s ease-in;
}
@keyframes slideIn {
  0% { transform: translateY(100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* 🔘 Botón volver estilizado */
.btn-volver {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 10px 20px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  text-decoration: none;
  transition: all 0.3s ease;
}
.btn-volver:hover {
  background: linear-gradient(135deg, #0056b3, #004080);
  transform: translateY(-2px);
  color: #fff;
}
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
    <div id="resultado" class="resultado text-center mt-3"></div>
  </form>

  <a href="panel.php" class="btn-volver mt-4"><i class="bi bi-arrow-left-circle"></i> Volver al panel</a>
</div>

<!-- 🤖 Agente Virtual -->
<div id="agente-virtual">
  <img src="https://cootaxconsota.com/wp-content/uploads/2025/11/IMG-20250604-WA0008.jpg" alt="Agente Virtual">
  <div class="mensaje" id="mensaje-agente">Cargando...</div>
</div>

<script>
// ==========================
// 🔢 CÁLCULO DEL SERVICIO AUTOMÁTICO
// ==========================
function calcularHoras() {
  const inicio = document.getElementById('horaInicio').value;
  const fin = document.getElementById('horaFin').value;

  if (!inicio || !fin) return;

  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);

  let inicioMin = h1 * 60 + m1;
  let finMin = h2 * 60 + m2;

  if (finMin < inicioMin) finMin += 24 * 60;

  const totalMin = finMin - inicioMin;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;

  let valorServicio = 0;

  if (horas === 0 && minutos > 0) {
    valorServicio = 30000;
  } else {
    valorServicio = horas * 30000;
    if (minutos > 0 && minutos <= 40) valorServicio += minutos * 500;
    else if (minutos > 40) valorServicio += 30000;
  }

  document.getElementById('resultado').innerHTML = `
    <div class="alert alert-info">
      <strong>Duración:</strong> ${horas}h ${minutos}min<br>
      <strong>Valor total:</strong> $${valorServicio.toLocaleString()}
    </div>
  `;

  hablarResultado("<?= htmlspecialchars($usuario) ?>", horas, minutos, valorServicio);
}

// ==========================
// 🎤 FUNCIONES DE TEXTO A VOZ
// ==========================
function hablarTexto(texto) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = 'es-CO';
  utter.rate = 1.15;
  utter.pitch = 1.0;
  utter.volume = 1;

  const seleccionarVoz = () => {
    const voces = synth.getVoices();
    const preferidas = [
      'Google español de Latinoamérica',
      'Google español',
      'Microsoft Raul Online (Natural)',
      'Microsoft Jorge Online (Natural)',
      'Microsoft Pablo Online (Natural)'
    ];
    const vozElegida = voces.find(v => preferidas.includes(v.name)) || voces.find(v => v.lang.startsWith('es'));
    if (vozElegida) utter.voice = vozElegida;
    synth.speak(utter);
  };

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = seleccionarVoz;
  } else {
    seleccionarVoz();
  }

  const mensaje = document.getElementById('mensaje-agente');
  mensaje.textContent = texto;
  mensaje.style.background = 'rgba(0,123,255,0.9)';
  mensaje.style.color = 'white';
  mensaje.classList.remove('fadeIn');
  void mensaje.offsetWidth; // reiniciar animación
  mensaje.classList.add('fadeIn');
}

function hablarResultado(usuario, horas, minutos, valor) {
  const valorPesos = valor.toLocaleString('es-CO');
  const mensaje = `${usuario}, el tiempo total es ${horas} ${horas === 1 ? 'hora' : 'horas'} y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}. El valor total del servicio es ${valorPesos} pesos.`;
  hablarTexto(mensaje);
}

// ==========================
// 👋 SALUDO AUTOMÁTICO SEGÚN HORA DEL DÍA
// ==========================
window.addEventListener('load', () => {
  const usuario = "<?= htmlspecialchars($usuario) ?>";
  const hora = new Date().getHours();
  let saludo = "¡Hola " + usuario + "!";

  if (hora < 12) saludo = "¡Buenos días, " + usuario + "!";
  else if (hora < 18) saludo = "¡Buenas tardes, " + usuario + "!";
  else saludo = "¡Buenas noches, " + usuario + "!";

  setTimeout(() => hablarTexto(saludo), 1000);
});

// ==========================
// 🔄 CALCULO AUTOMÁTICO AL CAMBIAR HORAS
// ==========================
document.getElementById('horaInicio').addEventListener('input', calcularHoras);
document.getElementById('horaFin').addEventListener('input', calcularHoras);
</script>
</body>
</html>
