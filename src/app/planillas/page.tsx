import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PlanillasClient from './PlanillasClient';

export default async function PlanillasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener planillas con datos de vehículos (solo pendientes y recaudadas)
  const adminClient = createAdminClient();
  const { data: planillas } = await adminClient
    .from('planillas')
    .select(`
      *,
      vehiculos:vehiculo_id (codigo_vehiculo),
      usuarios:operador_id (usuario)
    `)
    .in('estado', ['pendiente', 'recaudada'])
    .order('fecha', { ascending: false })
    .limit(50);

  // Obtener vehículos para el formulario
  const { data: vehiculos } = await adminClient
    .from('vehiculos')
    .select('*')
    .order('codigo_vehiculo', { ascending: true });

  // Obtener operadores
  const { data: operadores } = await adminClient
    .from('modulos')
    .select('*')
    .eq('descripcion', 'Operador')
    .order('nombre', { ascending: true });

  // Obtener configuración para valor predeterminado
  const { data: configuracion } = await adminClient
    .from('configuracion')
    .select('valor_planilla_defecto')
    .single();

  return <PlanillasClient 
    planillas={planillas || []} 
    vehiculos={vehiculos || []} 
    operadores={operadores || []} 
    valorDefecto={configuracion?.valor_planilla_defecto || 0}
  />;
}
