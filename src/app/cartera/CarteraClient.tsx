'use client';

import { useState, useEffect } from 'react';
import { procesarPagoVehiculo } from './actions';

// Función para formatear fecha en formato Colombia (dd/mm/yyyy)
function formatFechaColombia(fecha: any): string {
  if (!fecha) return '';
  const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString?.() || String(fecha);
  const match = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return fechaStr;
}

export default function CarteraClient({ vehiculos }: { vehiculos: any[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [vehiculoExpandido, setVehiculoExpandido] = useState<number | null>(null);
  const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nombreOperador, setNombreOperador] = useState('');
  const [filtroAntiguedad, setFiltroAntiguedad] = useState<'todos' | 'ultimos15' | 'mas15' | 'meses'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState('todos');

  // Obtener nombre del operador desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('operadorSeleccionado');
    if (stored) {
      try {
        const op = JSON.parse(stored);
        if (op && op.nombre) {
          setNombreOperador(op.nombre);
        }
      } catch (e) {
        console.error('Error parsing operador:', e);
      }
    }
  }, []);

  useEffect(() => {
    setVehiculoExpandido(null);
    setPlanillasSeleccionadas([]);
    if (filtroAntiguedad !== 'meses') {
      setMesSeleccionado('todos');
    }
  }, [filtroAntiguedad]);

  function getDiasAntiguedad(fecha: any) {
    if (!fecha) return 0;
    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaObj.setHours(0, 0, 0, 0);

    const diff = hoy.getTime() - fechaObj.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  function getMesClave(fecha: any) {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return '';
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function getMesEtiqueta(claveMes: string) {
    const [year, month] = claveMes.split('-').map(Number);
    if (!year || !month) return claveMes;
    const fecha = new Date(year, month - 1, 1);
    return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  const opcionesMeses = Array.from(
    new Set(
      vehiculos
        .flatMap((vehiculo) => vehiculo.planillas || [])
        .filter((planilla: any) => getDiasAntiguedad(planilla.fecha) >= 30)
        .map((planilla: any) => getMesClave(planilla.fecha))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  function cumpleFiltroAntiguedad(fecha: any) {
    const dias = getDiasAntiguedad(fecha);
    if (filtroAntiguedad === 'ultimos15') return dias <= 15;
    if (filtroAntiguedad === 'mas15') return dias > 15 && dias < 30;
    if (filtroAntiguedad === 'meses') {
      if (dias < 30) return false;
      if (mesSeleccionado === 'todos') return true;
      return getMesClave(fecha) === mesSeleccionado;
    }
    return true;
  }

  const vehiculosFiltradosAntiguedad = vehiculos
    .map((vehiculo) => {
      const planillasFiltradas = (vehiculo.planillas || []).filter((planilla: any) => cumpleFiltroAntiguedad(planilla.fecha));
      const totalFiltrado = planillasFiltradas.reduce((sum: number, planilla: any) => sum + (parseFloat(String(planilla.valor)) || 0), 0);

      return {
        ...vehiculo,
        planillas: planillasFiltradas,
        total: totalFiltrado
      };
    })
    .filter((vehiculo) => vehiculo.planillas.length > 0);

  const vehiculosVisibles = vehiculosFiltradosAntiguedad.filter((vehiculo) =>
    vehiculo.codigo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlanillasPendientes = vehiculosFiltradosAntiguedad.reduce(
    (sum, vehiculo) => sum + (vehiculo.planillas?.length || 0),
    0
  );

  const totalAdeudado = vehiculosFiltradosAntiguedad.reduce(
    (sum, vehiculo) => sum + (parseFloat(String(vehiculo.total)) || 0),
    0
  );

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

    const result = await procesarPagoVehiculo(vehiculoId, planillasSeleccionadas, nombreOperador);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Pago procesado correctamente');
      setTimeout(() => window.location.reload(), 1500);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                Cartera
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">Planillas de crédito pendientes</h1>
              <p className="mt-2 text-sm text-white/80">Gestione recaudos por vehículo y procese pagos parciales o totales.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {nombreOperador && (
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                  Operador: {nombreOperador}
                </span>
              )}
              <a href="/dashboard" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                Volver
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 pb-6 pt-4 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Filtro por antiguedad de deuda</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltroAntiguedad('todos')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filtroAntiguedad === 'todos' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroAntiguedad('ultimos15')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filtroAntiguedad === 'ultimos15' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                Ultimos 15 dias
              </button>
              <button
                type="button"
                onClick={() => setFiltroAntiguedad('mas15')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filtroAntiguedad === 'mas15' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                Mas de 15 dias
              </button>
              <button
                type="button"
                onClick={() => setFiltroAntiguedad('meses')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filtroAntiguedad === 'meses' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                Meses
              </button>
            </div>

            {filtroAntiguedad === 'meses' && (
              <div className="mt-3 max-w-sm">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Seleccione mes</label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
                >
                  <option value="todos" className="text-slate-900">Todos los meses</option>
                  {opcionesMeses.map((mes) => (
                    <option key={mes} value={mes} className="text-slate-900">
                      {getMesEtiqueta(mes)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {(error || message) && (
          <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vehículos con deuda</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{vehiculosFiltradosAntiguedad.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Planillas pendientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalPlanillasPendientes}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total adeudado</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              ${totalAdeudado.toLocaleString('es-CO')}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Búsqueda</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Vehículos en cartera</h2>
            </div>
            <div className="w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Buscar vehículo por código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {vehiculosVisibles.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">No hay vehículos con planillas pendientes</p>
              <p className="mt-1 text-sm text-slate-500">Ajuste el filtro de busqueda o antiguedad.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {vehiculosVisibles.map((vehiculo) => {
                  const totalSeleccionado = vehiculo.planillas
                    .filter((p: any) => planillasSeleccionadas.includes(p.id))
                    .reduce((sum: number, p: any) => sum + (parseFloat(String(p.valor)) || 0), 0);

                  return (
                    <div key={vehiculo.vehiculo_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-100"
                        onClick={() => toggleVehiculo(vehiculo.vehiculo_id)}
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Vehículo {vehiculo.codigo_vehiculo}</h3>
                          <p className="mt-1 text-sm text-slate-600">{vehiculo.planillas.length} planilla(s) pendiente(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">${(parseFloat(String(vehiculo.total)) || 0).toLocaleString('es-CO')}</p>
                          <p className="text-sm text-slate-500">Total adeudado</p>
                        </div>
                      </button>

                      {vehiculoExpandido === vehiculo.vehiculo_id && (
                        <div className="border-t border-slate-200 bg-white p-5">
                          <div className="space-y-2">
                            {vehiculo.planillas.map((planilla: any) => (
                              <label
                                key={planilla.id}
                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300"
                              >
                                <input
                                  type="checkbox"
                                  checked={planillasSeleccionadas.includes(planilla.id)}
                                  onChange={() => togglePlanilla(planilla.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-900">N° {planilla.numero_planilla}</p>
                                  <p className="text-sm text-slate-600">{planilla.conductor} - {formatFechaColombia(planilla.fecha)}</p>
                                </div>
                                <p className="text-sm font-bold text-slate-900">${(parseFloat(String(planilla.valor)) || 0).toLocaleString('es-CO')}</p>
                              </label>
                            ))}
                          </div>

                          {planillasSeleccionadas.length > 0 && (
                            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-lg font-semibold text-slate-900">
                                Total seleccionado: ${totalSeleccionado.toLocaleString('es-CO')}
                              </p>
                              <button
                                onClick={() => handleProcesarPago(vehiculo.vehiculo_id)}
                                disabled={loading}
                                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {loading ? 'Procesando...' : 'Procesar pago'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
