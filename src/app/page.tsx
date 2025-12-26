import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center justify-center px-6 py-12 text-center max-w-6xl">
        <div className="mb-8">
          <div className="text-7xl mb-4">🚖</div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Cootaxconsota
          </h1>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
            Sistema de Planillas
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Gestión eficiente de recaudo, liquidaciones y cartera para la cooperativa de taxis
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-lg"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border-2 border-blue-600 text-lg"
          >
            Registrarse
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Planillas de Recaudo
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Registro rápido de planillas de contado y crédito con control de saldos
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">💵</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Liquidaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sistema de aprobación con supervisores y control de operaciones
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Gestión de Cartera
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Control de saldos, deudas y recargas de débito por vehículo
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">🚖</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Vehículos
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Administración de vehículos con códigos únicos y estados
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Reportes
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Informes detallados por período, vehículo y operador
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Auditoría
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Seguimiento completo de todas las operaciones del sistema
            </p>
          </div>
        </div>

        <div className="mt-12 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6 max-w-3xl">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⚡</div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Sistema Optimizado para tu Cooperativa
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>✓ Control de roles: Administrador, Supervisor y Operador</li>
                <li>✓ Sesiones seguras con límite de tiempo por rol</li>
                <li>✓ Notificaciones por Telegram (opcional)</li>
                <li>✓ Respaldo automático y auditoría completa</li>
                <li>✓ Interface moderna y responsive</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
