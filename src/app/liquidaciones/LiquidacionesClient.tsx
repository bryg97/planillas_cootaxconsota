'use client';

import { useState } from "react";
import { crearLiquidacion, aprobarLiquidacion } from "./actions";
import * as XLSX from 'xlsx';

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
  const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<any[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");
  const [planillaDetalle, setPlanillaDetalle] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Debug logs
  console.log('LiquidacionesClient - Rol:', rol);
  console.log('LiquidacionesClient - Planillas recibidas:', planillas?.length || 0);
  console.log('LiquidacionesClient - Liquidaciones pendientes:', liquidacionesPendientes?.length || 0);



    function seleccionarTodas() {
      const idsVisibles = planillasFiltradas.map((p) => p.id);
      setPlanillasSeleccionadas(idsVisibles);
    }

    function deseleccionarTodas() {
      setPlanillasSeleccionadas([]);
    }

    const planillasFiltradas = planillas.filter((p) => {
      const textoBusqueda = busqueda.toLowerCase();
      const cumpleBusqueda = !busqueda || (
        p.numero_planilla?.toLowerCase().includes(textoBusqueda) ||
        p.conductor?.toLowerCase().includes(textoBusqueda) ||
        p.vehiculos?.codigo_vehiculo?.toLowerCase().includes(textoBusqueda)
      );
      
      if (!cumpleBusqueda) return false;
      
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
        setMessage("");
        return;
      }
      if (!confirm("¿Crear liquidación con las planillas seleccionadas?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const result = await crearLiquidacion(planillasSeleccionadas);
        if (result.error) {
          setError(result.error);
          setMessage("");
        } else {
          setError("");
          setMessage("Liquidación creada correctamente. Esperando aprobación de tesorera.");
          setPlanillasSeleccionadas([]);
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (e) {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
        setMessage("");
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

    function exportarPlanillas() {
      const datosExportar = planillasFiltradas.map(p => ({
        'N° Planilla': p.numero_planilla,
        'Fecha': p.fecha ? p.fecha.split('-').reverse().join('/') : '',
        'Vehículo': p.vehiculos?.codigo_vehiculo || '',
        'Conductor': p.conductor,
        'Tipo': p.tipo_pago,
        'Valor': p.valor,
        'Estado': p.estado,
        'Seleccionada': planillasSeleccionadas.includes(p.id) ? 'Sí' : 'No'
      }));

      const ws = XLSX.utils.json_to_sheet(datosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planillas");

      // Aplicar ancho a columnas
      ws['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
      ];

      XLSX.writeFile(wb, `Planillas_Liquidacion_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // --- Aquí va el JSX ---
    return (

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botón regresar al dashboard estilo Operaciones */}
        <div className="flex justify-end mb-4">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
        {/* Mensajes de error y éxito */}
        {(error || message) && (
          <div className={`mb-4 p-3 rounded text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {error || message}
          </div>
        )}

        {/* Sección de planillas para liquidar (Operador y Administrador) */}
        {(rol === 'operador' || rol === 'administrador') && (
          <>
            {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{rol === 'administrador' ? 'Todas las Planillas para Liquidar' : 'Mis Planillas para Liquidar'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione las planillas que desea liquidar (de contado o crédito ya recaudado)
            </p>
          </div>
        </div>

        {/* Filtros de Fecha y Búsqueda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-4">Filtros</h3>
          
          {/* Buscador */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="🔍 Buscar por N° planilla, conductor o vehículo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtros de Fecha */}
          <h4 className="text-sm font-medium text-gray-700 mb-3">Por Fecha</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium">Limpiar</button>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={seleccionarTodas} className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium">Seleccionar</button>
            </div>
            <div className="flex items-end">
              <button onClick={deseleccionarTodas} className="w-full px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs font-medium">Deseleccionar</button>
            </div>
            <div className="flex items-end">
              <button onClick={exportarPlanillas} className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium">📥 Exportar</button>
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
                  <input type="checkbox" checked={planillasSeleccionadas.includes(planilla.id)} onChange={() => {
                    if (planillasSeleccionadas.includes(planilla.id)) {
                      setPlanillasSeleccionadas(planillasSeleccionadas.filter(id => id !== planilla.id));
                    } else {
                      setPlanillasSeleccionadas([...planillasSeleccionadas, planilla.id]);
                    }
                  }} className="mr-3 h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">N° {planilla.numero_planilla}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planilla.tipo_pago === 'credito' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{planilla.tipo_pago === 'credito' ? 'Crédito Recaudado' : 'Contado'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{planilla.estado}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{planilla.vehiculos?.codigo_vehiculo}</span> • {planilla.conductor} • {planilla.fecha}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-gray-900 ml-3">${planilla.valor.toLocaleString('es-CO')}</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setPlanillaDetalle(planilla);
                    }}
                    className="ml-3 text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Ver detalles
                  </button>
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
          </>
        )}

        {/* Sección tesorera */}
        {rol === 'tesorera' && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
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

        {/* Modal de detalles de planilla */}
        {planillaDetalle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Detalles de Planilla</h2>
                <button
                  onClick={() => setPlanillaDetalle(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">N° Planilla</label>
                  <p className="text-lg font-semibold">{planillaDetalle.numero_planilla}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vehículo</label>
                  <p className="text-lg font-semibold">{planillaDetalle.vehiculos?.codigo_vehiculo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Conductor</label>
                  <p className="text-lg font-semibold">{planillaDetalle.conductor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Valor</label>
                  <p className="text-2xl font-bold text-green-600">${parseFloat(planillaDetalle.valor).toLocaleString('es-CO')}</p>
                </div>
              </div>

              {/* Trazabilidad */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Trazabilidad</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-900 mb-2">Creado</label>
                    <p className="text-sm text-blue-800">
                      Fecha: {planillaDetalle.created_at ? new Date(planillaDetalle.created_at).toLocaleString('es-CO') : 'N/A'}
                    </p>
                    <p className="text-sm text-blue-800">
                      Por: {planillaDetalle.usuarios?.usuario || planillaDetalle.operador || 'Desconocido'}
                    </p>
                  </div>

                  {planillaDetalle.estado === 'recaudada' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-green-900 mb-2">Recaudado</label>
                      <p className="text-sm text-green-800">
                        Fecha: {planillaDetalle.fecha_recaudacion ? new Date(planillaDetalle.fecha_recaudacion).toLocaleString('es-CO') : 'Pendiente'}
                      </p>
                      <p className="text-sm text-green-800">
                        Por: {planillaDetalle.recaudada_por || 'Pendiente'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setPlanillaDetalle(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección administrador */}
        {rol === 'administrador' && (
          <>
            <h3 className="text-lg font-semibold mb-4 mt-8">Liquidaciones Pendientes de Aprobar</h3>
            {liquidacionesPendientes.length === 0 ? (
              <p className="text-gray-500 mb-8">No hay liquidaciones pendientes</p>
            ) : (
              <div className="space-y-4 mb-8">
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
          </>
        )}
      </main>
    );
}
