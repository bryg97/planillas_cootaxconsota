import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener rol del usuario desde la tabla usuarios usando cliente admin
  const { data: userData, error: userError } = await adminClient
    .from('usuarios')
    .select('rol')
    .eq('usuario', user.email)
    .single()

  // Log para debug (se verá en los logs de Vercel)
  console.log('User email:', user.email)
  console.log('User data from DB:', userData)
  console.log('Error:', userError)

  const rol = userData?.rol || 'operador'
  console.log('Rol final:', rol)

  // Obtener estadísticas básicas
  const { count: totalVehiculos } = await supabase
    .from('vehiculos')
    .select('*', { count: 'exact', head: true })

  const { count: totalPlanillas } = await supabase
    .from('planillas')
    .select('*', { count: 'exact', head: true })

  const { count: liquidacionesPendientes } = await supabase
    .from('liquidaciones')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  // Módulos según rol
  const modulos = [
    { nombre: 'Planillas', ruta: '/planillas', icono: '📋', color: 'blue', roles: ['administrador', 'supervisor', 'operador'] },
    { nombre: 'Operaciones', ruta: '/operaciones', icono: '⚙️', color: 'green', roles: ['administrador', 'operador'] },
    { nombre: 'Liquidaciones', ruta: '/liquidaciones', icono: '💵', color: 'purple', roles: ['administrador', 'operador', 'tesorera'] },
    { nombre: 'Cartera', ruta: '/cartera', icono: '💼', color: 'orange', roles: ['administrador', 'tesorera'] },
    { nombre: 'Vehículos', ruta: '/vehiculos', icono: '🚖', color: 'yellow', roles: ['administrador'] },
    { nombre: 'Reportes', ruta: '/reportes', icono: '📊', color: 'indigo', roles: ['administrador', 'supervisor'] },
    { nombre: 'Usuarios', ruta: '/usuarios', icono: '👥', color: 'red', roles: ['administrador'] },
    { nombre: 'Auditoría', ruta: '/auditoria', icono: '🔍', color: 'gray', roles: ['administrador', 'supervisor'] },
    { nombre: 'Configuración', ruta: '/configuracion', icono: '⚙️', color: 'teal', roles: ['administrador'] },
  ].filter(modulo => modulo.roles.includes(rol))

  const saludo = () => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 12) return 'Buenos días'
    if (hora >= 12 && hora < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚖</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cootaxconsota
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sistema de Planillas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {rol}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {saludo()}, {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Panel de control - {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Vehículos
              </h3>
              <div className="text-2xl">🚖</div>
            </div>
            <p className="text-3xl font-bold text-blue-600">{totalVehiculos || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Registrados</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Planillas
              </h3>
              <div className="text-2xl">📋</div>
            </div>
            <p className="text-3xl font-bold text-green-600">{totalPlanillas || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total registradas</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Liquidaciones
              </h3>
              <div className="text-2xl">⏳</div>
            </div>
            <p className="text-3xl font-bold text-orange-600">{liquidacionesPendientes || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Pendientes</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hoy
              </h3>
              <div className="text-2xl">📅</div>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('es-CO', { weekday: 'long' })}</p>
          </div>
        </div>

        {/* Módulos */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Módulos del Sistema
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modulos.map((modulo) => (
              <Link
                key={modulo.ruta}
                href={modulo.ruta}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
              >
                <div className="text-4xl mb-3">{modulo.icono}</div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {modulo.nombre}
                </h4>
              </Link>
            ))}
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Sistema de Planillas - Cootaxconsota
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Gestión completa de recaudo, liquidaciones y cartera para la cooperativa de taxis.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>✓ Registro de planillas de recaudo (contado/crédito)</li>
                <li>✓ Control de vehículos y saldos</li>
                <li>✓ Sistema de aprobación de liquidaciones</li>
                <li>✓ Gestión de cartera y cobros</li>
                <li>✓ Reportes y auditoría completa</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
