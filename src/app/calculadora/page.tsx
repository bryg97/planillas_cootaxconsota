import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import CalculadoraClient from './CalculadoraClient';

export default async function CalculadoraPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener el nombre del usuario (sin el email)
  const nombreUsuario = user.name || user.email?.split('@')[0] || 'Usuario';

  return <CalculadoraClient nombreUsuario={nombreUsuario} />;
}
