import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import LiquidacionesClient from './LiquidacionesClient';
import { getPlanillasParaLiquidar, getLiquidacionesPendientes } from './actions';

export default async function LiquidacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminClient = createAdminClient();
  
  // Obtener rol del usuario
  const { data: userData } = await adminClient
    .from('usuarios')
    .select('rol, id')
    .eq('usuario', user.email)
    .single();

  const rol = userData?.rol || 'operador';

  // Si es operador o administrador, obtener sus planillas
  let planillas: any[] = [];
  if (rol === 'operador' || rol === 'administrador') {
    planillas = await getPlanillasParaLiquidar(userData?.id);
  }

  // Si es tesorera o admin, obtener liquidaciones pendientes
  let liquidacionesPendientes: any[] = [];
  if (rol === 'tesorera' || rol === 'administrador' || rol === 'operador') {
    liquidacionesPendientes = await getLiquidacionesPendientes();
  }

  return (
    <LiquidacionesClient
      rol={rol}
      planillas={planillas}
      liquidacionesPendientes={liquidacionesPendientes}
    />
  );
}
