'use client';

import { useState } from 'react';
import { procesarPagoVehiculo } from './actions';

export default function CarteraClient({ vehiculos }: { vehiculos: any[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [vehiculoExpandido, setVehiculoExpandido] = useState<number | null>(null);
  const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  function toggleVehiculo(vehiculoId: number) {
    setVehiculoExpandido(vehiculoExpandido === vehiculoId ? null : vehiculoId);
    setPlanillasSeleccionadas([]);
  }

  function togglePlanilla(planillaId: number) {
    setPlanillasSeleccionadas(prev =>
      prev.includes(planillaId)
        ? prev.filter(id => id !== planillaId)
        : [...prev, planillaId]
    );
  }

  async function handleProcesarPago(vehiculoId: number) {
    if (planillasSeleccionadas.length === 0) {
      setError('Seleccione al menos una planilla');
      return;
    }

    if (!confirm('¿Confirmar pago de las planillas seleccionadas?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await procesarPagoVehiculo(vehiculoId, planillasSeleccionadas);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Pago procesado correctamente');
      setTimeout(() => window.location.reload(), 1500);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cartera - Planillas Pendientes</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Buscador de vehículos */}
        <div className="mb-6 max-w-md">
          <input
            type="text"
            placeholder="Buscar vehículo por código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {vehiculos.filter(v => v.codigo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No hay vehículos con planillas pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehiculos
              .filter(v => v.codigo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((vehiculo) => (
              <div key={vehiculo.vehiculo_id} className="bg-white rounded-lg shadow">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  onClick={() => toggleVehiculo(vehiculo.vehiculo_id)}
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      🚖 Vehículo: {vehiculo.codigo_vehiculo}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {vehiculo.planillas.length} planilla(s) pendiente(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      ${vehiculo.total.toLocaleString('es-CO')}
                    </p>
                    <p className="text-sm text-gray-500">Total adeudado</p>
                  </div>
                </div>

                {vehiculoExpandido === vehiculo.vehiculo_id && (
                  <div className="border-t p-4 bg-gray-50">
                    <div className="space-y-2 mb-4">
                      {vehiculo.planillas.map((planilla: any) => (
                        <label
                          key={planilla.id}
                          className="flex items-center p-3 bg-white rounded border hover:bg-blue-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={planillasSeleccionadas.includes(planilla.id)}
                            onChange={() => togglePlanilla(planilla.id)}
                            className="mr-3 h-4 w-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium">N° {planilla.numero_planilla}</p>
                            <p className="text-sm text-gray-600">
                              {planilla.conductor} - {new Date(planilla.fecha).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <p className="font-bold">${planilla.valor.toLocaleString('es-CO')}</p>
                        </label>
                      ))}
                    </div>

                    {planillasSeleccionadas.length > 0 && (
                      <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-lg font-semibold">
                          Total seleccionado: $
                          {vehiculo.planillas
                            .filter((p: any) => planillasSeleccionadas.includes(p.id))
                            .reduce((sum: number, p: any) => sum + p.valor, 0)
                            .toLocaleString('es-CO')}
                        </p>
                        <button
                          onClick={() => handleProcesarPago(vehiculo.vehiculo_id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {loading ? 'Procesando...' : 'Procesar Pago'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
