import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import PlanillasClient from './PlanillasClient';

export default async function PlanillasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener planillas con datos de vehículos (solo pendientes y recaudadas)
  const planillas = await query(`
    SELECT 
      p.id,
      p.numero_planilla,
      p.fecha,
      p.conductor,
      p.operador,
      p.valor,
      p.tipo_pago,
      p.estado,
      p.origen,
      p.destino,
      p.created_at,
      v.codigo_vehiculo
    FROM planillas p
    LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
    WHERE p.estado IN ('pendiente', 'recaudada')
    ORDER BY p.fecha DESC
    LIMIT 500
  `);

  // Obtener vehículos para el formulario
  const vehiculos = await query(
    'SELECT id, codigo_vehiculo, saldo FROM vehiculos ORDER BY codigo_vehiculo ASC'
  );

  // Obtener operadores
  const operadores = await query(
    "SELECT nombre FROM modulos WHERE descripcion = 'Operador' ORDER BY nombre ASC"
  );

  // Obtener configuración para valor predeterminado
  const configuracion = await query(
    'SELECT valor_planilla_defecto FROM configuracion LIMIT 1'
  );

  // Obtener rol del usuario
  const userData = await query(
    'SELECT rol FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  // Formatear datos para el cliente
  const planillasFormateadas = planillas.map((p: any) => ({
    ...p,
    vehiculos: { codigo_vehiculo: p.codigo_vehiculo }
  }));

  return (
    <PlanillasClient
      planillas={planillasFormateadas}
      vehiculos={vehiculos}
      operadores={operadores}
      valorDefecto={configuracion[0]?.valor_planilla_defecto}
      rol={userData[0]?.rol || 'operador'}
    />
  );
}
