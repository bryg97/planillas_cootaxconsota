// Servicio de notificaciones de Telegram
import { query } from '@/lib/db';

interface PlanillaNotificacion {
  operador: string;
  vehiculo: string;
  conductor: string;
  numero_planilla: string;
  fecha: string;
}

interface DineroEntregado {
  operador: string;
  recibe: string;
  planillas: Array<{
    numero: string;
    monto: number;
  }>;
}

interface PagoVehiculo {
  vehiculo: string;
  autorizo: string;
  planillas: Array<{
    numero: string;
    monto: number;
  }>;
  total: number;
  fecha: string;
}

interface RecaudoCredito {
  operador: string;
  planillas: Array<{
    numero: string;
    monto: number;
    vehiculo: string;
    conductor: string;
  }>;
  total: number;
  fecha: string;
}

interface NuevoViaje {
  operador: string;
  lateral: string;
  conductor: string;
  convenio: string;
  origen: string;
  destino: string;
  medioContacto: string;
  autorizador: string;
  fecha: string;
  omiteConsecutivo: boolean;
  motivoOmision: string | null;
}

function formatearMedioContacto(medio: string) {
  if (medio === 'llamada_telefonica') return 'Llamada telefonica';
  if (medio === 'whatsapp') return 'WhatsApp';
  if (medio === 'mensajeria_app') return 'Mensajeria de la aplicacion';
  return medio;
}

async function getConfiguracion() {
  const result = await query(
    'SELECT bot_telegram, canal_telegram FROM configuracion WHERE id = 1'
  );
  
  return result?.[0];
}

async function enviarMensajeTelegram(mensaje: string) {
  const config = await getConfiguracion();
  
  if (!config?.bot_telegram || !config?.canal_telegram) {
    console.warn('Telegram no configurado');
    return { success: false, error: 'Telegram no configurado' };
  }

  try {
    const url = `https://api.telegram.org/bot${config.bot_telegram}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.canal_telegram,
        text: mensaje,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error enviando mensaje Telegram:', data);
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (error) {
    console.error('Error al enviar mensaje Telegram:', error);
    return { success: false, error: String(error) };
  }
}

export async function notificarNuevaPlanillaCredito(data: PlanillaNotificacion) {
  const mensaje = `📄 <b>Nueva Planilla Credito</b>

👤 Operador: ${data.operador}
🚕 Vehiculo: ${data.vehiculo}
🧑 Conductor: ${data.conductor}
📄 N°: ${data.numero_planilla}
🕒 ${data.fecha}`;

  return await enviarMensajeTelegram(mensaje);
}

export async function notificarDineroEntregado(data: DineroEntregado) {
  const listaPlanillas = data.planillas
    .map(p => `- ${p.numero} → $${p.monto.toLocaleString('es-CO')}`)
    .join('\n');

  const mensaje = `💰 <b>DINERO ENTREGADO</b>

👤 Operador: ${data.operador}
👩 Recibe: ${data.recibe}
📄 Planillas:
${listaPlanillas}`;

  return await enviarMensajeTelegram(mensaje);
}

export async function notificarPagoVehiculo(data: PagoVehiculo) {
  const listaPlanillas = data.planillas
    .map(p => `- N°${p.numero} → $${p.monto.toLocaleString('es-CO')}`)
    .join('\n');

  const mensaje = `✅ <b>PAGO TOTAL VEHICULO</b>

🚖 Vehiculo: ${data.vehiculo}
👤 Autorizó: ${data.autorizo}

Planillas pagadas:
${listaPlanillas}

💸 Total pagado: $${data.total.toLocaleString('es-CO')}
🕒 ${data.fecha}`;

  return await enviarMensajeTelegram(mensaje);
}

export async function notificarRecaudoCredito(data: RecaudoCredito) {
  const listaPlanillas = data.planillas
    .map(p => `- N° ${p.numero} (${p.vehiculo}) ${p.conductor}  $${p.monto.toLocaleString('es-CO')}`)
    .join('\n');

  const mensaje = `📊 <b>CREDITO RECAUDADO</b>

👤 Operador: ${data.operador}
📄 Planillas:
${listaPlanillas}

💸 Total recaudado: $${data.total.toLocaleString('es-CO')}
🕒 ${data.fecha}`;

  return await enviarMensajeTelegram(mensaje);
}

export async function notificarNuevoViaje(data: NuevoViaje) {
  const bloqueOmision = data.omiteConsecutivo
    ? `\n⚠️ Omitio consecutivo: SI\n📝 Motivo: ${data.motivoOmision || 'Sin detalle'}`
    : '\n⚠️ Omitio consecutivo: NO';

  const mensaje = `🧭 <b>NUEVO VIAJE REGISTRADO</b>

👤 Operador: ${data.operador}
🚕 Lateral: ${data.lateral}
🧑 Conductor: ${data.conductor}
🏢 Convenio: ${data.convenio}
📍 Origen: ${data.origen}
🏁 Destino: ${data.destino}
📞 Contacto: ${formatearMedioContacto(data.medioContacto)}
✅ Autorizo: ${data.autorizador}${bloqueOmision}
🕒 ${data.fecha}`;

  return await enviarMensajeTelegram(mensaje);
}
