import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import UsuariosClient from './UsuariosClient';

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener usuarios
  const adminClient = createAdminClient();
  const { data: usuarios } = await adminClient
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false });

  return <UsuariosClient usuarios={usuarios || []} />;
}
