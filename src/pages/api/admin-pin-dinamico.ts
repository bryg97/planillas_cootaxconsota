import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { enviarPinDinamicoAdminCorreo } from '@/lib/email';
import { enviarPinDinamicoAdminTelegram } from '@/lib/telegram';

type AdminUser = {
  id: number;
  usuario: string;
  rol: string;
  activo: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
  }

  const { email } = req.body || {};

  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ ok: false, error: 'Email requerido' });
  }

  try {
    const hasDynamicPinHashColumn = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
          AND column_name = 'pin_dinamico_hash'
      ) AS exists`
    );

    const hasDynamicPinExpireColumn = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
          AND column_name = 'pin_dinamico_expira_en'
      ) AS exists`
    );

    if (!hasDynamicPinHashColumn?.[0]?.exists || !hasDynamicPinExpireColumn?.[0]?.exists) {
      return res.status(400).json({
        ok: false,
        error: 'Falta configurar PIN dinamico en BD. Ejecuta la migracion neon-add-admin-dynamic-pin.sql',
      });
    }

    const users = await query<AdminUser>(
      'SELECT id, usuario, rol, activo FROM usuarios WHERE usuario = $1 LIMIT 1',
      [email.trim()]
    );

    if (!users.length) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    const user = users[0];

    if (!user.activo) {
      return res.status(403).json({ ok: false, error: 'Usuario inhabilitado' });
    }

    if (user.rol !== 'administrador') {
      return res.status(403).json({ ok: false, error: 'Solo aplica para administradores' });
    }

    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const pinHash = await bcrypt.hash(pin, 10);
    const minutosVigencia = 10;

    await query(
      `UPDATE usuarios
       SET pin_dinamico_hash = $1,
           pin_dinamico_expira_en = NOW() + INTERVAL '10 minutes'
       WHERE id = $2`,
      [pinHash, user.id]
    );

    const [correo, telegram] = await Promise.all([
      enviarPinDinamicoAdminCorreo(user.usuario, pin, minutosVigencia),
      enviarPinDinamicoAdminTelegram({ usuario: user.usuario, pin, minutosVigencia }),
    ]);

    if (!correo.success || !telegram.success) {
      return res.status(500).json({
        ok: false,
        error: 'No se pudo enviar el PIN dinamico por ambos canales (correo y Telegram). Verifica configuracion.',
        detalles: {
          correo: correo.success ? null : correo.error,
          telegram: telegram.success ? null : telegram.error,
        },
      });
    }

    return res.status(200).json({ ok: true, mensaje: 'PIN dinamico enviado a correo y Telegram' });
  } catch (error) {
    console.error('Error generando PIN dinamico admin:', error);
    return res.status(500).json({ ok: false, error: 'Error interno al generar PIN dinamico' });
  }
}
