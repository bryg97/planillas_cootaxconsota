import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OperacionesClient from './OperacionesClient';

export default async function OperacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminClient = createAdminClient();
  
  // Obtener datos del usuario actual
  const { data: userData } = await adminClient
    .from('usuarios')
    .select('id, usuario, rol')
    .eq('usuario', user.email)
    .single();

  // Obtener planillas del día actual
  const hoy = new Date().toISOString().split('T')[0];
  const { data: planillasHoy } = await adminClient
    .from('planillas')
    .select(`
      *,
      vehiculos:vehiculo_id (codigo_vehiculo)
    `)
    .eq('fecha', hoy)
    .order('id', { ascending: false });

  // Obtener mis liquidaciones pendientes (si soy operador)
  const { data: misLiquidaciones } = await adminClient
    .from('liquidaciones')
    .select(`
      *,
      liquidaciones_detalle:liquidaciones_detalle(
        planilla_id,
        planillas:planilla_id (
          numero_planilla,
          valor,
          vehiculos:vehiculo_id (codigo_vehiculo)
        )
      )
    `)
    .eq('operador_id', userData?.id)
    .eq('estado', 'pendiente')
    .order('fecha_liquidacion', { ascending: false });

  // Estadísticas del día
  const totalRecaudado = planillasHoy?.reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0) || 0;
  const planillasContado = planillasHoy?.filter(p => p.tipo_pago === 'contado').length || 0;
  const planillasCredito = planillasHoy?.filter(p => p.tipo_pago === 'credito').length || 0;
  const planillasPendientes = planillasHoy?.filter(p => p.estado === 'pendiente').length || 0;

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
      usuario={userData}
    />
  );
}
