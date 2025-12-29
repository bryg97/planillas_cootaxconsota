
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ReportesClient from './ReportesClient';

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const adminClient = createAdminClient();
  const { data: planillas } = await adminClient
    .from('planillas')
    .select('id, numero_planilla, fecha, vehiculo_id, conductor, valor, tipo_pago, estado, vehiculos(codigo_vehiculo)');
  const { data: liquidaciones } = await adminClient
    .from('liquidaciones')
    .select('id, numero_liquidacion, fecha, conductor, valor, estado');

  // Estadísticas generales
  const totalPlanillas = planillas?.length || 0;
  const totalRecaudado = planillas?.reduce((sum, p) => sum + parseFloat(p.valor), 0) || 0;
  const totalVehiculos = (await adminClient.from('vehiculos').select('id')).data?.length || 0;

  return (
    <ReportesClient
      planillas={planillas || []}
      liquidaciones={liquidaciones || []}
      totalPlanillas={totalPlanillas}
      totalVehiculos={totalVehiculos}
      totalRecaudado={totalRecaudado}
    />
  );
}
