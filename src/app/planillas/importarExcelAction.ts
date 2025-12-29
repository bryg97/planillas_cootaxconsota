import { createAdminClient } from '@/lib/supabase/admin';

export async function importarPlanillasDesdeExcel(planillas: any[]) {
  const adminClient = createAdminClient();
  // Validar y mapear los datos
  const planillasValidas = planillas.map((p: any) => ({
    numero_planilla: p.numero_planilla,
    fecha: p.fecha,
    vehiculo_id: parseInt(p.vehiculo_id),
    conductor: p.conductor,
    operador: p.operador,
    origen: p.origen,
    destino: p.destino,
    valor: parseFloat(p.valor),
    tipo_pago: p.tipo_pago,
    estado: p.estado || 'pendiente',
  })).filter(p => p.numero_planilla && p.fecha && p.vehiculo_id && p.conductor && p.operador && p.origen && p.destino && p.valor && p.tipo_pago);

  if (planillasValidas.length === 0) {
    return { error: 'No hay datos válidos para importar.' };
  }

  const { error } = await adminClient
    .from('planillas')
    .insert(planillasValidas);

  if (error) {
    return { error: error.message };
  }
  return { success: true, cantidad: planillasValidas.length };
}
