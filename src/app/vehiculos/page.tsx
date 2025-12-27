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

  // Obtener vehículos
  const adminClient = createAdminClient();
  const { data: vehiculos } = await adminClient
    .from('vehiculos')
    .select('*')
    .order('codigo_vehiculo', { ascending: true });

  return <VehiculosClient vehiculos={vehiculos || []} />;
}

