import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import ConfiguracionClient from './ConfiguracionClient';

export default async function ConfiguracionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener configuración (siempre buscar id=1)
  const configuracion = await query(
    'SELECT * FROM configuracion WHERE id = 1'
  );

  // Obtener operadores (guardados en modulos con descripcion='Operador')
  const operadores = await query(
    `SELECT * FROM modulos WHERE descripcion = 'Operador' ORDER BY nombre ASC`
  );

  // Obtener vehículos para la depuración
  const vehiculos = await query(
    `SELECT id, codigo_vehiculo FROM vehiculos ORDER BY codigo_vehiculo ASC`
  );

  return <ConfiguracionClient 
    configuracion={configuracion?.[0]} 
    operadores={operadores || []} 
    vehiculos={vehiculos || []}
  />;
}
