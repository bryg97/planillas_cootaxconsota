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
  
  // Obtener métricas del dashboard
  const metricas = await obtenerMetricasDashboard();
  
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

  return <DashboardClient user={user} rol={rol} modulos={modulos} metricas={metricas} />;
}

async function obtenerMetricasDashboard() {
  try {
    // Dinero sin liquidar (planillas de contado o crédito recaudado, pero no liquidadas)
    const planillasSinLiquidar = await query<{ total: string }>(`
      SELECT COALESCE(SUM(valor), 0) as total 
      FROM planillas 
      WHERE estado NOT IN ('liquidada', 'pagada', 'aprobada')
      AND (tipo_pago = 'contado' OR (tipo_pago = 'credito' AND estado = 'recaudada'))
    `);
    const dineroSinLiquidar = parseFloat(planillasSinLiquidar?.[0]?.total || '0');

    // Cartera total (créditos pendientes de recaudar)
    const carteraTotal = await query<{ total: string }>(`
      SELECT COALESCE(SUM(valor), 0) as total 
      FROM planillas 
      WHERE tipo_pago = 'credito' AND estado = 'pendiente'
    `);
    const totalCartera = parseFloat(carteraTotal?.[0]?.total || '0');

    // Liquidaciones pendientes de aprobar
    const liquidacionesPendientes = await query<{ count: string; total: string }>(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
      FROM liquidaciones 
      WHERE estado = 'pendiente'
    `);
    const numLiquidacionesPendientes = parseInt(liquidacionesPendientes?.[0]?.count || '0', 10);
    const montoLiquidacionesPendientes = parseFloat(liquidacionesPendientes?.[0]?.total || '0');

    // Total recaudado este mes
    const recaudadoMes = await query<{ total: string }>(`
      SELECT COALESCE(SUM(valor), 0) as total 
      FROM planillas 
      WHERE fecha >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    const totalRecaudadoMes = parseFloat(recaudadoMes?.[0]?.total || '0');

    // Planillas creadas hoy
    const planillasHoy = await query<{ count: string }>(`
      SELECT COUNT(*) as count 
      FROM planillas 
      WHERE DATE(fecha) = CURRENT_DATE
    `);
    const numPlanillasHoy = parseInt(planillasHoy?.[0]?.count || '0', 10);

    // Total vehículos activos
    const vehiculos = await query<{ count: string }>(`
      SELECT COUNT(*) as count 
      FROM vehiculos
    `);
    const totalVehiculos = parseInt(vehiculos?.[0]?.count || '0', 10);

    return {
      dineroSinLiquidar,
      totalCartera,
      numLiquidacionesPendientes,
      montoLiquidacionesPendientes,
      totalRecaudadoMes,
      numPlanillasHoy,
      totalVehiculos,
    };
  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    return {
      dineroSinLiquidar: 0,
      totalCartera: 0,
      numLiquidacionesPendientes: 0,
      montoLiquidacionesPendientes: 0,
      totalRecaudadoMes: 0,
      numPlanillasHoy: 0,
      totalVehiculos: 0,
    };
  }
}
