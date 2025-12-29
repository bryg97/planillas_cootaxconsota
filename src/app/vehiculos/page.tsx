import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import VehiculosClient from './VehiculosClient';


export default async function VehiculosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener el rol del usuario desde la tabla usuarios
  const adminClient = createAdminClient();
  const { data: usuarioRow, error } = await adminClient
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single();

  if (error || !usuarioRow) {
    // Si no se encuentra el usuario, redirigir al login por seguridad
    redirect('/login');
  }

  if (usuarioRow.rol !== 'tesorera' && usuarioRow.rol !== 'administrador') {
    // Si no es tesorera ni administrador, redirigir al dashboard
    redirect('/dashboard');
  }

  // Obtener vehículos
  const { data: vehiculos } = await adminClient
    .from('vehiculos')
    .select('*')
    .order('codigo_vehiculo', { ascending: true });

  return <VehiculosClient vehiculos={vehiculos || []} />;
}

