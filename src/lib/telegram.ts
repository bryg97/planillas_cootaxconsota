// Servicio de notificaciones de Telegram
import { createAdminClient } from '@/lib/supabase/admin';

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

async function getConfiguracion() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('configuracion')
    .select('bot_telegram, canal_telegram')
    .eq('id', 1)
    .maybeSingle();
  
  return data;
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
  const mensaje = `📄 <b>Nueva Planilla Crédito</b>

👤 Operador: ${data.operador}
🚕 Vehículo: ${data.vehiculo}
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

  const mensaje = `✅ <b>PAGO TOTAL VEHÍCULO</b>

🚖 Vehículo: ${data.vehiculo}
👤 Autorizó: ${data.autorizo}

Planillas pagadas:
${listaPlanillas}

💸 Total pagado: $${data.total.toLocaleString('es-CO')}
🕒 ${data.fecha}`;

  return await enviarMensajeTelegram(mensaje);
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

export async function notificarRecaudoCredito(data: RecaudoCredito) {
  const listaPlanillas = data.planillas
    .map(p => `- N�${p.numero} (${p.vehiculo}) ${p.conductor}  $${p.monto.toLocaleString('es-CO')}`)
    .join('\n');

  const mensaje = ` <b>CR�DITO RECAUDADO</b>

 Operador: ${data.operador}
 Planillas:
${listaPlanillas}

 Total recaudado: $${data.total.toLocaleString('es-CO')}
 ${data.fecha}`;

  return await enviarMensajeTelegram(mensaje);
}
