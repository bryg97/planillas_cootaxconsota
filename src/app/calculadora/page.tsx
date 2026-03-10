import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import CalculadoraClient from './CalculadoraClient';

export default async function CalculadoraPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener configuración
  const configuracion = await query(
    'SELECT valor_hora_calculadora, valor_minuto_calculadora FROM configuracion WHERE id = 1'
  );

  // El nombre real del operador se obtiene desde localStorage en el cliente
  // Aquí solo pasamos un fallback
  const nombreUsuario = user.email?.split('@')[0] || 'Usuario';

  return <CalculadoraClient 
    nombreUsuario={nombreUsuario}
    valorHora={Number(configuracion?.[0]?.valor_hora_calculadora) || 30000}
    valorMinuto={Number(configuracion?.[0]?.valor_minuto_calculadora) || 500}
  />;
}
