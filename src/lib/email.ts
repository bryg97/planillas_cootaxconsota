import { Resend } from 'resend';

type NuevoViajeEmail = {
  operador: string;
  lateral: string;
  numeroPlanilla: string;
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
    ? `
      <div style="margin-top:16px; border:1px solid #f5c2c7; background:#fff5f5; border-radius:10px; padding:12px;">
        <p style="margin:0; font-size:12px; color:#991b1b; font-weight:700; letter-spacing:0.02em;">ALERTA DE OMISION</p>
        <p style="margin:8px 0 0; font-size:14px; color:#7f1d1d;"><strong>Omitio consecutivo:</strong> SI</p>
        <p style="margin:6px 0 0; font-size:14px; color:#7f1d1d;"><strong>Motivo:</strong> ${data.motivoOmision || 'Sin detalle'}</p>
      </div>
    `
    : `
      <div style="margin-top:16px; border:1px solid #c7f5d7; background:#f0fdf4; border-radius:10px; padding:12px;">
        <p style="margin:0; font-size:14px; color:#166534;"><strong>Omitio consecutivo:</strong> NO</p>
      </div>
    `;

  const subject = `Nuevo viaje registrado - Lateral ${data.lateral}`;
  const html = `
    <div style="background:#f1f5f9; margin:0; padding:24px; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a); padding:20px 24px; color:#ffffff;">
          <p style="margin:0; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; opacity:0.85;">Notificacion automatica</p>
          <h2 style="margin:8px 0 0; font-size:24px; line-height:1.2;">Nuevo viaje registrado</h2>
          <p style="margin:10px 0 0; font-size:13px; opacity:0.9;">Se registro un nuevo servicio en el modulo de viajes.</p>
        </div>

        <div style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b; width:40%;">Operador</td>
              <td style="padding:8px 0; font-size:14px; font-weight:700; color:#0f172a;">${data.operador}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Lateral</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${data.lateral}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Planilla</td>
              <td style="padding:8px 0; font-size:14px; font-weight:700; color:#0f172a;">${data.numeroPlanilla}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Conductor</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${data.conductor}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Convenio</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${data.convenio}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Origen</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${data.origen}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Destino</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${data.destino}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Contacto</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${formatearMedioContacto(data.medioContacto)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-size:13px; color:#64748b;">Autorizo</td>
              <td style="padding:8px 0; font-size:14px; color:#0f172a;">${data.autorizador}</td>
            </tr>
          </table>

          ${bloqueOmision}

          <div style="margin-top:16px; border-top:1px dashed #cbd5e1; padding-top:12px;">
            <p style="margin:0; font-size:12px; color:#64748b;">Fecha de registro</p>
            <p style="margin:5px 0 0; font-size:14px; font-weight:700; color:#0f172a;">${data.fecha}</p>
          </div>
        </div>

        <div style="border-top:1px solid #e2e8f0; background:#f8fafc; padding:12px 24px;">
          <p style="margin:0; font-size:11px; color:#64748b;">Mensaje generado automaticamente por el sistema de planillas.</p>
        </div>
      </div>
    </div>
  `;

  const text = [
    'NUEVO VIAJE REGISTRADO',
    `Operador: ${data.operador}`,
    `Lateral: ${data.lateral}`,
    `Planilla: ${data.numeroPlanilla}`,
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
