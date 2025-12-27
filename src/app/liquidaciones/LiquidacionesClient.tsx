'use client';

import { useState } from 'react';
import { crearLiquidacion, aprobarLiquidacion } from './actions';

export default function LiquidacionesClient({ 
  rol,
  planillas,
  liquidacionesPendientes
}: { 
  rol: string;
  planillas: any[];
  liquidacionesPendientes: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<number[]>([]);

  function togglePlanilla(planillaId: number) {
    setPlanillasSeleccionadas(prev =>
      prev.includes(planillaId)
        ? prev.filter(id => id !== planillaId)
        : [...prev, planillaId]
    );
  }

  async function handleCrearLiquidacion() {
    if (planillasSeleccionadas.length === 0) {
      setError('Seleccione al menos una planilla');
      return;
    }

    if (!confirm('¿Crear liquidación con las planillas seleccionadas?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await crearLiquidacion(planillasSeleccionadas);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Liquidación creada correctamente. Esperando aprobación de tesorera.');
      setPlanillasSeleccionadas([]);
      setTimeout(() => window.location.reload(), 2000);
    }

    setLoading(false);
  }

  async function handleAprobarLiquidacion(liquidacionId: number) {
    if (!confirm('¿Confirmar recepción de dinero?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await aprobarLiquidacion(liquidacionId);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Liquidación aprobada y notificación enviada');
      setTimeout(() => window.location.reload(), 2000);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
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

        {rol === 'operador' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Mis Planillas para Liquidar</h2>
            
            {planillas.length === 0 ? (
              <p className="text-gray-500">No tienes planillas pendientes de liquidar</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {planillas.map((planilla) => (
                    <label
                      key={planilla.id}
                      className="flex items-center p-3 bg-gray-50 rounded border hover:bg-blue-50 cursor-pointer"
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
                          {planilla.vehiculos?.codigo_vehiculo} - {planilla.conductor} - 
                          {new Date(planilla.fecha).toLocaleDateString('es-CO')} - 
                          <span className={`ml-2 ${planilla.tipo_pago === 'credito' ? 'text-orange-600' : 'text-green-600'}`}>
                            {planilla.tipo_pago === 'credito' ? 'Crédito' : 'Contado'}
                          </span>
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
                      {planillas
                        .filter(p => planillasSeleccionadas.includes(p.id))
                        .reduce((sum, p) => sum + p.valor, 0)
                        .toLocaleString('es-CO')}
                    </p>
                    <button
                      onClick={handleCrearLiquidacion}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Procesando...' : 'Crear Liquidación'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {rol === 'tesorera' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Liquidaciones Pendientes de Aprobar</h2>
            
            {liquidacionesPendientes.length === 0 ? (
              <p className="text-gray-500">No hay liquidaciones pendientes</p>
            ) : (
              <div className="space-y-4">
                {liquidacionesPendientes.map((liquidacion) => (
                  <div key={liquidacion.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Operador: {liquidacion.usuarios?.usuario}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Fecha: {new Date(liquidacion.fecha).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${liquidacion.total.toLocaleString('es-CO')}
                        </p>
                        <p className="text-sm text-gray-500">Total a recibir</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Planillas incluidas:</p>
                      <div className="space-y-1">
                        {liquidacion.liquidaciones_detalle.map((detalle: any, idx: number) => (
                          <div key={idx} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                            <span>
                              N° {detalle.planillas?.numero_planilla} - 
                              {detalle.planillas?.vehiculos?.codigo_vehiculo}
                            </span>
                            <span className="font-medium">${detalle.monto.toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAprobarLiquidacion(liquidacion.id)}
                      disabled={loading}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Procesando...' : 'Confirmar Recepción de Dinero'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {rol === 'administrador' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Todas las Planillas</h2>
              {planillas.length === 0 ? (
                <p className="text-gray-500">No hay planillas</p>
              ) : (
                <div className="space-y-2">
                  {planillas.slice(0, 10).map((planilla) => (
                    <div key={planilla.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">N° {planilla.numero_planilla}</p>
                      <p className="text-sm text-gray-600">
                        {planilla.operador} - ${planilla.valor.toLocaleString('es-CO')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Liquidaciones Pendientes</h2>
              {liquidacionesPendientes.length === 0 ? (
                <p className="text-gray-500">No hay liquidaciones pendientes</p>
              ) : (
                <div className="space-y-2">
                  {liquidacionesPendientes.map((liq) => (
                    <div key={liq.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">{liq.usuarios?.usuario}</p>
                      <p className="text-sm text-gray-600">
                        ${liq.total.toLocaleString('es-CO')} - {liq.liquidaciones_detalle.length} planillas
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
