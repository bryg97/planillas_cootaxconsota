import DashboardClient from './DashboardClient';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

type RolRow = { rol: string };

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userData = await query<RolRow>(
    'SELECT rol FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  const rol = userData[0]?.rol || 'operador';
  const modulos = [
    { nombre: 'Planillas', ruta: '/planillas', icono: '📋', color: 'blue', roles: ['administrador', 'supervisor', 'operador'] },
    { nombre: 'Operaciones', ruta: '/operaciones', icono: '⚙️', color: 'green', roles: ['administrador', 'operador'] },
    { nombre: 'Liquidaciones', ruta: '/liquidaciones', icono: '💵', color: 'purple', roles: ['administrador', 'operador', 'tesorera'] },
    { nombre: 'Cartera', ruta: '/cartera', icono: '💼', color: 'orange', roles: ['administrador', 'tesorera'] },
    { nombre: 'Histórico', ruta: '/historico', icono: '📜', color: 'cyan', roles: ['administrador', 'supervisor', 'tesorera'] },
    { nombre: 'Vehículos', ruta: '/vehiculos', icono: '🚖', color: 'yellow', roles: ['administrador', 'tesorera'] },
    { nombre: 'Reportes', ruta: '/reportes', icono: '📊', color: 'indigo', roles: ['administrador', 'supervisor', 'operador'] },
    { nombre: 'Calculadora', ruta: '/calculadora', icono: '🧮', color: 'pink', roles: ['administrador', 'supervisor', 'operador', 'tesorera'] },
    { nombre: 'Usuarios', ruta: '/usuarios', icono: '👥', color: 'red', roles: ['administrador'] },
    { nombre: 'Auditoría', ruta: '/auditoria', icono: '🔍', color: 'gray', roles: ['administrador', 'supervisor'] },
    { nombre: 'Configuración', ruta: '/configuracion', icono: '⚙️', color: 'teal', roles: ['administrador'] },
  ].filter(modulo => modulo.roles.includes(rol));

  return <DashboardClient user={user} rol={rol} modulos={modulos} />;
}
