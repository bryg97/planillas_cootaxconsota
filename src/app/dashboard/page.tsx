import DashboardClient from './DashboardClient';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await adminClient
    .from('usuarios')
    .select('rol')
    .eq('usuario', user.email)
    .single();

  const rol = userData?.rol || 'operador';
  const modulos = [
    { nombre: 'Planillas', ruta: '/planillas', icono: '📋', color: 'blue', roles: ['administrador', 'supervisor', 'operador'] },
    { nombre: 'Operaciones', ruta: '/operaciones', icono: '⚙️', color: 'green', roles: ['administrador', 'operador'] },
    { nombre: 'Liquidaciones', ruta: '/liquidaciones', icono: '💵', color: 'purple', roles: ['administrador', 'operador', 'tesorera'] },
    { nombre: 'Cartera', ruta: '/cartera', icono: '💼', color: 'orange', roles: ['administrador', 'tesorera'] },
    { nombre: 'Histórico', ruta: '/historico', icono: '📜', color: 'cyan', roles: ['administrador', 'supervisor', 'tesorera'] },
    { nombre: 'Vehículos', ruta: '/vehiculos', icono: '🚖', color: 'yellow', roles: ['administrador', 'tesorera'] },
    { nombre: 'Reportes', ruta: '/reportes', icono: '📊', color: 'indigo', roles: ['administrador', 'supervisor', 'operador'] },
    { nombre: 'Usuarios', ruta: '/usuarios', icono: '👥', color: 'red', roles: ['administrador'] },
    { nombre: 'Auditoría', ruta: '/auditoria', icono: '🔍', color: 'gray', roles: ['administrador', 'supervisor'] },
    { nombre: 'Configuración', ruta: '/configuracion', icono: '⚙️', color: 'teal', roles: ['administrador'] },
  ].filter(modulo => modulo.roles.includes(rol));

  return <DashboardClient user={user} rol={rol} modulos={modulos} />;
}
