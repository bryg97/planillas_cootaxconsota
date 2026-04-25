import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

type PinUser = {
  id: number;
  usuario: string;
  rol: string;
  activo: boolean;
  pin_acceso_hash: string | null;
  pin_dinamico_hash?: string | null;
  pin_dinamico_expira_en?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
  }

  const { email, pin } = req.body || {};

  if (typeof email !== 'string' || typeof pin !== 'string') {
    return res.status(400).json({ ok: false, error: 'Datos incompletos' });
  }

  if (!/^\d{4,8}$/.test(pin)) {
    return res.status(400).json({ ok: false, error: 'PIN invalido' });
  }

  try {
    const hasPinColumn = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
          AND column_name = 'pin_acceso_hash'
      ) AS exists`
    );

    if (!hasPinColumn?.[0]?.exists) {
      return res.status(400).json({ ok: false, error: 'La base de datos no tiene configurado PIN de acceso aun' });
    }

    const users = await query<PinUser>(
      'SELECT id, usuario, rol, activo, pin_acceso_hash FROM usuarios WHERE usuario = $1 LIMIT 1',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    const user = users[0];

    if (!user.activo) {
      return res.status(403).json({ ok: false, error: 'Usuario inhabilitado' });
    }

    if (user.rol === 'administrador') {
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

      const adminRows = await query<PinUser>(
        'SELECT id, pin_dinamico_hash, pin_dinamico_expira_en FROM usuarios WHERE id = $1 LIMIT 1',
        [user.id]
      );

      const adminData = adminRows[0];
      if (!adminData?.pin_dinamico_hash || !adminData?.pin_dinamico_expira_en) {
        return res.status(400).json({
          ok: false,
          error: 'No hay un PIN dinamico vigente. Solicita un nuevo codigo.',
        });
      }

      const expiraEn = new Date(adminData.pin_dinamico_expira_en);
      if (Number.isNaN(expiraEn.getTime()) || expiraEn.getTime() < Date.now()) {
        return res.status(401).json({ ok: false, error: 'El PIN dinamico ha expirado. Solicita uno nuevo.' });
      }

      const isDynamicValid = await bcrypt.compare(pin, adminData.pin_dinamico_hash);
      if (!isDynamicValid) {
        return res.status(401).json({ ok: false, error: 'PIN dinamico incorrecto' });
      }

      await query(
        'UPDATE usuarios SET pin_dinamico_hash = NULL, pin_dinamico_expira_en = NULL WHERE id = $1',
        [user.id]
      );

      return res.status(200).json({ ok: true });
    }

    if (!user.pin_acceso_hash) {
      return res.status(403).json({ ok: false, error: 'Su usuario no tiene PIN configurado. Contacte al administrador.' });
    }

    const isValid = await bcrypt.compare(pin, user.pin_acceso_hash);

    if (!isValid) {
      return res.status(401).json({ ok: false, error: 'PIN incorrecto' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error validando PIN:', error);
    return res.status(500).json({ ok: false, error: 'Error interno al validar PIN' });
  }
}
