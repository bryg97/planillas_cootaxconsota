import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import CalculadoraClient from './CalculadoraClient';

export default async function CalculadoraPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // El nombre real del operador se obtiene desde localStorage en el cliente
  // Aquí solo pasamos un fallback
  const nombreUsuario = user.email?.split('@')[0] || 'Usuario';

  return <CalculadoraClient nombreUsuario={nombreUsuario} />;
}
