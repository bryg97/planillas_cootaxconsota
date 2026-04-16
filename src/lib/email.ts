import { Resend } from 'resend';

type NuevoViajeEmail = {
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
};

function formatearMedioContacto(medio: string) {
  if (medio === 'llamada_telefonica') return 'Llamada telefonica';
  if (medio === 'whatsapp') return 'WhatsApp';
  if (medio === 'mensajeria_app') return 'Mensajeria de la aplicacion';
  return medio;
}

function obtenerDestinatarios(): string[] {
  const raw = process.env.RESEND_TO_EMAIL || '';
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

export async function notificarNuevoViajeCorreo(data: NuevoViajeEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const toEmails = obtenerDestinatarios();

  if (!apiKey || !fromEmail || toEmails.length === 0) {
    return {
      success: false,
      error: 'Resend no configurado. Defina RESEND_API_KEY, RESEND_FROM_EMAIL y RESEND_TO_EMAIL.',
    };
  }

  const resend = new Resend(apiKey);
  const bloqueOmision = data.omiteConsecutivo
    ? `<p><strong>Omitio consecutivo:</strong> SI</p><p><strong>Motivo:</strong> ${data.motivoOmision || 'Sin detalle'}</p>`
    : '<p><strong>Omitio consecutivo:</strong> NO</p>';

  const subject = `Nuevo viaje registrado - Lateral ${data.lateral}`;
  const html = `
    <h2>Nuevo viaje registrado</h2>
    <p><strong>Operador:</strong> ${data.operador}</p>
    <p><strong>Lateral:</strong> ${data.lateral}</p>
    <p><strong>Conductor:</strong> ${data.conductor}</p>
    <p><strong>Convenio:</strong> ${data.convenio}</p>
    <p><strong>Origen:</strong> ${data.origen}</p>
    <p><strong>Destino:</strong> ${data.destino}</p>
    <p><strong>Contacto:</strong> ${formatearMedioContacto(data.medioContacto)}</p>
    <p><strong>Autorizo:</strong> ${data.autorizador}</p>
    ${bloqueOmision}
    <p><strong>Fecha:</strong> ${data.fecha}</p>
  `;

  const text = [
    'NUEVO VIAJE REGISTRADO',
    `Operador: ${data.operador}`,
    `Lateral: ${data.lateral}`,
    `Conductor: ${data.conductor}`,
    `Convenio: ${data.convenio}`,
    `Origen: ${data.origen}`,
    `Destino: ${data.destino}`,
    `Contacto: ${formatearMedioContacto(data.medioContacto)}`,
    `Autorizo: ${data.autorizador}`,
    `Omitio consecutivo: ${data.omiteConsecutivo ? 'SI' : 'NO'}`,
    data.omiteConsecutivo ? `Motivo: ${data.motivoOmision || 'Sin detalle'}` : '',
    `Fecha: ${data.fecha}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error enviando correo con Resend';
    console.error('Error notificacion correo viaje:', message);
    return { success: false, error: message };
  }
}
