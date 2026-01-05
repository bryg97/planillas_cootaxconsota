import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import CarteraClient from './CarteraClient';
import { getCarteraVehiculos } from './actions';

export default async function CarteraPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const vehiculos = await getCarteraVehiculos();

  return <CarteraClient vehiculos={vehiculos} />;
}
