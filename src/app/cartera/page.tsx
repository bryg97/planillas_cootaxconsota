import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function CarteraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener resumen de cartera por vehículo
  const adminClient = createAdminClient();
  const { data: vehiculos } = await adminClient
    .from('vehiculos')
    .select('*')
    .order('saldo_pendiente', { ascending: false });

  // Calcular totales
  const totalSaldo = vehiculos?.reduce((sum, v) => sum + parseFloat(v.saldo.toString()), 0) || 0;
  const totalPendiente = vehiculos?.reduce((sum, v) => sum + parseFloat(v.saldo_pendiente.toString()), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cartera</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen de Cartera */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Vehículos</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{vehiculos?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Saldo Total</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">${totalSaldo.toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Pendiente</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
        </div>

        {/* Tabla de Cartera */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Estado de Cuenta por Vehículo</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código Vehículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Pendiente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehiculos && vehiculos.length > 0 ? (
                  vehiculos.map((vehiculo: any) => {
                    const saldoPendiente = parseFloat(vehiculo.saldo_pendiente.toString());
                    const tienePendiente = saldoPendiente > 0;
                    
                    return (
                      <tr key={vehiculo.id} className={tienePendiente ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vehiculo.codigo_vehiculo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(vehiculo.saldo.toString()).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={tienePendiente ? 'text-red-600 font-bold' : 'text-gray-900'}>
                            ${saldoPendiente.toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tienePendiente 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {tienePendiente ? 'Con Deuda' : 'Al Día'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Ver Detalle</button>
                          {tienePendiente && (
                            <button className="text-green-600 hover:text-green-900">Registrar Pago</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No hay registros de cartera
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
