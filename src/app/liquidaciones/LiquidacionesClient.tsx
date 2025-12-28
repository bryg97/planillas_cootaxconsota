'use client';

import { useState } from "react";
import { crearLiquidacion, aprobarLiquidacion } from "./actions";

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


  export default function LiquidacionesClient({
    rol,
    planillas,
    liquidacionesPendientes,
  }: {
    rol: string;
    planillas: any[];
    liquidacionesPendientes: any[];
  }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<number[]>([]);
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    function togglePlanilla(planillaId: number) {
      setPlanillasSeleccionadas((prev) =>
        prev.includes(planillaId)
          ? prev.filter((id) => id !== planillaId)
          : [...prev, planillaId]
      );
    }

    function seleccionarTodas() {
      const idsVisibles = planillasFiltradas.map((p) => p.id);
      setPlanillasSeleccionadas(idsVisibles);
    }

    function deseleccionarTodas() {
      setPlanillasSeleccionadas([]);
    }

    const planillasFiltradas = planillas.filter((p) => {
      if (!fechaDesde && !fechaHasta) return true;
      const fechaPlanilla = new Date(p.fecha);
      const desde = fechaDesde ? new Date(fechaDesde) : null;
      const hasta = fechaHasta ? new Date(fechaHasta) : null;
      if (desde && hasta) {
        return fechaPlanilla >= desde && fechaPlanilla <= hasta;
      } else if (desde) {
        return fechaPlanilla >= desde;
      } else if (hasta) {
        return fechaPlanilla <= hasta;
      }
      return true;
    });

    async function handleCrearLiquidacion() {
      if (planillasSeleccionadas.length === 0) {
        setError("Seleccione al menos una planilla");
        return;
      }
      if (!confirm("¿Crear liquidación con las planillas seleccionadas?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      const result = await crearLiquidacion(planillasSeleccionadas);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Liquidación creada correctamente. Esperando aprobación de tesorera.");
        setPlanillasSeleccionadas([]);
        setTimeout(() => window.location.reload(), 2000);
      }
      setLoading(false);
    }

    async function handleAprobarLiquidacion(liquidacionId: number) {
      if (!confirm("¿Confirmar recepción de dinero?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      const result = await aprobarLiquidacion(liquidacionId);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Liquidación aprobada y notificación enviada");
        setTimeout(() => window.location.reload(), 2000);
      }
      setLoading(false);
    }

    // --- Aquí va el JSX ---
    return (
      <main>
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Mis Planillas para Liquidar</h2>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione las planillas que desea liquidar (de contado o crédito ya recaudado)
            </p>
          </div>
        </div>

        {/* Filtros de Fecha */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-3">Filtrar por Fecha</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Limpiar Filtros
                  </button>
                  <main>
                    {/* Encabezado */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">Mis Planillas para Liquidar</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Seleccione las planillas que desea liquidar (de contado o crédito ya recaudado)
                        </p>
                      </div>
                    </div>

                    {/* Filtros de Fecha */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="font-medium text-blue-900 mb-3">Filtrar por Fecha</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                          <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                          <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Limpiar Filtros</button>
                          <button onClick={seleccionarTodas} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Seleccionar Todas</button>
                          <button onClick={deseleccionarTodas} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm">Deseleccionar</button>
                        </div>
                      </div>
                    </div>

                    {/* Listado y selección de planillas */}
                    {planillasFiltradas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No tienes planillas para liquidar en este rango de fechas</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 text-sm text-gray-600">
                          Mostrando {planillasFiltradas.length} planilla(s) • {planillasSeleccionadas.length} seleccionada(s)
                        </div>
                        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                          {planillasFiltradas.map((planilla) => (
                            <label key={planilla.id} className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${planillasSeleccionadas.includes(planilla.id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                              <input type="checkbox" checked={planillasSeleccionadas.includes(planilla.id)} onChange={() => togglePlanilla(planilla.id)} className="mr-3 h-5 w-5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">N° {planilla.numero_planilla}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planilla.tipo_pago === 'credito' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{planilla.tipo_pago === 'credito' ? 'Crédito Recaudado' : 'Contado'}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{planilla.estado}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">{planilla.vehiculos?.codigo_vehiculo}</span> • {planilla.conductor} • {new Date(planilla.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })}
                                </p>
                              </div>
                              <p className="font-bold text-lg text-gray-900 ml-3">${planilla.valor.toLocaleString('es-CO')}</p>
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Resumen y botón de liquidación */}
                    {planillasSeleccionadas.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">Total a liquidar:</p>
                            <p className="text-2xl font-bold text-blue-900">
                              ${planillas.filter(p => planillasSeleccionadas.includes(p.id)).reduce((sum, p) => sum + p.valor, 0).toLocaleString('es-CO')}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{planillasSeleccionadas.length} planilla(s) seleccionada(s)</p>
                          </div>
                          <button onClick={handleCrearLiquidacion} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg">{loading ? 'Procesando...' : 'Crear Liquidación →'}</button>
                        </div>
                      </div>
                    )}

                    {/* Sección tesorera */}
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
                                    <h3 className="text-lg font-semibold">Operador: {liquidacion.usuarios?.usuario}</h3>
                                    <p className="text-sm text-gray-600">Fecha: {new Date(liquidacion.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">${liquidacion.total.toLocaleString('es-CO')}</p>
                                    <p className="text-sm text-gray-500">Total a recibir</p>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Planillas incluidas:</p>
                                  <div className="space-y-1">
                                    {liquidacion.liquidaciones_detalle.map((detalle: any, idx: number) => (
                                      <div key={idx} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                                        <span>N° {detalle.planillas?.numero_planilla} - {detalle.planillas?.vehiculos?.codigo_vehiculo}</span>
                                        <span className="font-medium">${detalle.monto.toLocaleString('es-CO')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <button onClick={() => handleAprobarLiquidacion(liquidacion.id)} disabled={loading} className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">{loading ? 'Procesando...' : 'Confirmar Recepción de Dinero'}</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección administrador */}
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
                                  <p className="text-sm text-gray-600">{planilla.operador} - ${planilla.valor.toLocaleString('es-CO')}</p>
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
                                  <p className="text-sm text-gray-600">${liq.total.toLocaleString('es-CO')} - {liq.liquidaciones_detalle.length} planillas</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </main>
                );
              </div>
