import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener estadísticas generales
  const adminClient = createAdminClient();
  
  const { count: totalPlanillas } = await adminClient
    .from('planillas')
    .select('*', { count: 'exact', head: true });

  const { count: totalVehiculos } = await adminClient
    .from('vehiculos')
    .select('*', { count: 'exact', head: true });

  const { data: planillas } = await adminClient
    .from('planillas')
    .select('valor');

  const totalRecaudado = planillas?.reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Generales */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Estadísticas Generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Planillas</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPlanillas || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Vehículos</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalVehiculos || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Recaudo Total</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">${totalRecaudado.toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>

        {/* Opciones de Reportes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Generar Reportes</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reporte de Planillas */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Planillas</h3>
                <p className="text-gray-600 mb-4">Consulta planillas por fecha, vehículo o conductor</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Generar Reporte
                </button>
              </div>

              {/* Reporte de Liquidaciones */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Liquidaciones</h3>
                <p className="text-gray-600 mb-4">Estado de liquidaciones por período</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Generar Reporte
                </button>
              </div>

              {/* Reporte de Cartera */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Cartera</h3>
                <p className="text-gray-600 mb-4">Estado de cuentas y saldos pendientes</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Generar Reporte
                </button>
              </div>

              {/* Reporte de Vehículos */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Vehículos</h3>
                <p className="text-gray-600 mb-4">Listado completo de vehículos afiliados</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Generar Reporte
                </button>
              </div>

              {/* Reporte de Operaciones */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte Diario de Operaciones</h3>
                <p className="text-gray-600 mb-4">Resumen de operaciones por día</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Generar Reporte
                </button>
              </div>

              {/* Reporte Financiero */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte Financiero</h3>
                <p className="text-gray-600 mb-4">Estado financiero general del período</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
