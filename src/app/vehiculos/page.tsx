import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import VehiculosClient from './VehiculosClient';


export default async function VehiculosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener el rol del usuario
  const usuarioRow = await query(
    'SELECT rol FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  if (!usuarioRow || usuarioRow.length === 0) {
    redirect('/login');
  }

  if (usuarioRow[0]?.rol !== 'tesorera' && usuarioRow[0]?.rol !== 'administrador') {
    redirect('/dashboard');
  }

  // Obtener vehículos con saldo pendiente calculado
  const vehiculos = await query(`
    SELECT 
      v.*,
      COALESCE(SUM(p.valor), 0) as saldo_pendiente
    FROM vehiculos v
    LEFT JOIN planillas p ON v.id = p.vehiculo_id AND p.estado = 'pendiente'
    GROUP BY v.id
    ORDER BY v.codigo_vehiculo ASC
  `);

  return <VehiculosClient vehiculos={vehiculos} />;
}

