import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import LiquidacionesClient from './LiquidacionesClient';
import { getPlanillasParaLiquidar, getLiquidacionesPendientes } from './actions';

type UsuarioRolRow = { rol: string; id: number };

export default async function LiquidacionesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener rol del usuario
  const userData = await query<UsuarioRolRow>(
    'SELECT rol, id FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  const rol = userData[0]?.rol || 'operador';

  // Si es operador o administrador, obtener TODAS las planillas
  let planillas: any[] = [];
  if (rol === 'operador' || rol === 'administrador') {
    planillas = await getPlanillasParaLiquidar();
    console.log('Liquidaciones Page - Rol:', rol, '- Planillas obtenidas:', planillas.length);
  }

  // Si es tesorera o admin, obtener liquidaciones pendientes
  let liquidacionesPendientes: any[] = [];
  if (rol === 'tesorera' || rol === 'administrador' || rol === 'operador') {
    liquidacionesPendientes = await getLiquidacionesPendientes();
    console.log('Liquidaciones Page - Liquidaciones pendientes:', liquidacionesPendientes.length);
  }

  return (
    <LiquidacionesClient
      rol={rol}
      planillas={planillas}
      liquidacionesPendientes={liquidacionesPendientes}
    />
  );
}
