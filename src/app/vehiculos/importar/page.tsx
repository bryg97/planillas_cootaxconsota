import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import ImportarVehiculosClient from './ImportarVehiculosClient';

export default async function ImportarVehiculosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <ImportarVehiculosClient />;
}
