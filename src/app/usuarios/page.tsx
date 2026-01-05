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
  const usuarios = await query(
    'SELECT * FROM usuarios ORDER BY created_at DESC'
  );

  return <UsuariosClient usuarios={usuarios || []} />;
}
