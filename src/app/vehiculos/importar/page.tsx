import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ImportarVehiculosClient from './ImportarVehiculosClient';

export default async function ImportarVehiculosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ImportarVehiculosClient />;
}
