import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import UsuariosClient from './UsuariosClient';

export default async function UsuariosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener usuarios
  const hasActivoColumn = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
        AND column_name = 'activo'
    ) AS exists`
  );

  const usuarios = hasActivoColumn?.[0]?.exists
    ? await query(
        'SELECT id, usuario, rol, created_at, activo FROM usuarios ORDER BY activo DESC, created_at DESC'
      )
    : await query(
        'SELECT id, usuario, rol, created_at, true AS activo FROM usuarios ORDER BY created_at DESC'
      );

  return <UsuariosClient usuarios={usuarios || []} />;
}
