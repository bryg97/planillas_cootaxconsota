import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import PlanillasClient from './PlanillasClient';

type PlanillaRow = {
  id: number;
  numero_planilla: string;
  fecha: string;
  conductor: string;
  operador: string;
  valor: number;
  tipo_pago: string;
  estado: string;
  origen: string | null;
  destino: string | null;
  created_at: string;
  codigo_vehiculo: string | null;
};

export default async function PlanillasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener planillas con datos de vehículos (solo pendientes y recaudadas)
  const planillas = await query<PlanillaRow>(`
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
    `SELECT
      id,
      codigo_vehiculo,
      saldo,
      credito_sin_limite,
      autorizado_por_nombre,
      autorizado_por_identificacion,
      autorizado_desde,
      autorizado_hasta
    FROM vehiculos
    ORDER BY codigo_vehiculo ASC`
  );

  // Obtener operadores
  const operadores = await query(
    "SELECT nombre FROM modulos WHERE descripcion = 'Operador' ORDER BY nombre ASC"
  );

  // Obtener configuración para valor predeterminado
  const configuracion = await query<{ valor_planilla_defecto: number }>(
    'SELECT valor_planilla_defecto FROM configuracion LIMIT 1'
  );

  // Obtener rol del usuario
  const userData = await query<{ rol: string }>(
    'SELECT rol FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  // Formatear datos para el cliente
  const planillasFormateadas = planillas.map((p) => ({
    ...p,
    vehiculos: { codigo_vehiculo: p.codigo_vehiculo || '' }
  }));

  return (
    <PlanillasClient
      planillas={planillasFormateadas}
      vehiculos={vehiculos || []}
      operadores={operadores || []}
      valorDefecto={configuracion[0]?.valor_planilla_defecto || 0}
      rol={userData[0]?.rol || 'operador'}
    />
  );
}
