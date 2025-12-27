import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ConfiguracionClient from './ConfiguracionClient';

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminClient = createAdminClient();
  
  // Obtener configuración (siempre buscar id=1)
  const { data: configuracion } = await adminClient
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  // Obtener operadores (guardados en modulos con descripcion='Operador')
  const { data: operadores } = await adminClient
    .from('modulos')
    .select('*')
    .eq('descripcion', 'Operador')
    .order('nombre', { ascending: true });

  return <ConfiguracionClient configuracion={configuracion} operadores={operadores || []} />;
}
