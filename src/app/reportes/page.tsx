
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import ReportesClient from './ReportesClient';

export default async function ReportesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const planillas = await query(`
    SELECT p.id, p.numero_planilla, p.fecha, p.vehiculo_id, p.conductor, p.valor, p.tipo_pago, p.estado, v.codigo_vehiculo
    FROM planillas p
    LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
  `);

  // Estadísticas generales
  const totalPlanillas = planillas?.length || 0;
  const totalRecaudado = planillas?.reduce((sum: number, p: any) => sum + parseFloat(p.valor || 0), 0) || 0;
  const vehiculosCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM vehiculos');
  const totalVehiculos = parseInt(vehiculosCount[0]?.count || '0', 10);

  return (
    <ReportesClient
      planillas={planillas || []}
      totalPlanillas={totalPlanillas}
      totalVehiculos={totalVehiculos}
      totalRecaudado={totalRecaudado}
    />
  );
}
