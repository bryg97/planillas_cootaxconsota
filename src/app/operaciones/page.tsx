import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import OperacionesClient from './OperacionesClient';

type UsuarioRow = {
  id: number;
  usuario: string;
  rol: string;
};

type PlanillaHoy = {
  valor: number;
  tipo_pago: string;
  estado: string;
};

export default async function OperacionesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener datos del usuario actual
  const userData = await query<UsuarioRow>(
    'SELECT id, usuario, rol FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  const userRow = userData[0];

  // Obtener planillas del día local (zona horaria de Bogotá)
  const bogota = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
  const fechaLocal = new Date(bogota);
  const yyyy = fechaLocal.getFullYear();
  const mm = String(fechaLocal.getMonth() + 1).padStart(2, '0');
  const dd = String(fechaLocal.getDate()).padStart(2, '0');
  const hoyLocal = `${yyyy}-${mm}-${dd}`;

  // Traer todas las planillas cuya fecha esté entre 00:00 y 23:59 del día local
  const planillasHoy = await query<PlanillaHoy>(`
    SELECT 
      p.*,
      v.codigo_vehiculo
    FROM planillas p
    LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
    WHERE DATE(p.fecha) = $1::date
    ORDER BY p.id DESC
  `, [hoyLocal]);

  // Obtener mis liquidaciones pendientes (si soy operador)
  const misLiquidaciones = await query(`
    SELECT 
      l.*,
      json_agg(json_build_object(
        'planilla_id', ld.planilla_id,
        'planillas', json_build_object(
          'numero_planilla', p.numero_planilla,
          'valor', p.valor,
          'codigo_vehiculo', v.codigo_vehiculo
        )
      )) as liquidaciones_detalle
    FROM liquidaciones l
    LEFT JOIN liquidaciones_detalle ld ON l.id = ld.liquidacion_id
    LEFT JOIN planillas p ON ld.planilla_id = p.id
    LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
    WHERE l.operador_id = $1 AND l.estado = 'pendiente'
    GROUP BY l.id
    ORDER BY l.fecha DESC
  `, [userRow?.id]);

  // Estadísticas del día
  const totalRecaudado = planillasHoy.reduce((sum, p) => sum + parseFloat(p.valor?.toString() || '0'), 0);
  const planillasContado = planillasHoy.filter((p) => p.tipo_pago === 'contado').length;
  const planillasCredito = planillasHoy.filter((p) => p.tipo_pago === 'credito').length;
  const planillasPendientes = planillasHoy.filter((p) => p.estado === 'pendiente').length;

  return (
    <OperacionesClient
      planillasHoy={planillasHoy || []}
      misLiquidaciones={misLiquidaciones || []}
      stats={{
        total: planillasHoy?.length || 0,
        recaudado: totalRecaudado,
        contado: planillasContado,
        credito: planillasCredito,
        pendientes: planillasPendientes
      }}
      usuario={userRow}
    />
  );
}
