import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CarteraClient from './CarteraClient';
import { getCarteraVehiculos } from './actions';

export default async function CarteraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const vehiculos = await getCarteraVehiculos();

  return <CarteraClient vehiculos={vehiculos} />;
}
