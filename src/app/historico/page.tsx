import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import HistoricoClient from './HistoricoClient';

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener planillas liquidadas y pagadas (histórico)
  const adminClient = createAdminClient();
  const { data: planillas } = await adminClient
    .from('planillas')
    .select(`
      *,
      vehiculos:vehiculo_id (codigo_vehiculo),
      usuarios:operador_id (usuario)
    `)
    .in('estado', ['liquidada', 'pagada', 'aprobada'])
    .order('fecha', { ascending: false })
    .limit(100);

  return <HistoricoClient planillas={planillas || []} />;
}
