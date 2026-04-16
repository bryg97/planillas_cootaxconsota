'use client';

import { useMemo, useState } from 'react';

function getFechaISO(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const texto = String(fecha);
  const soloFecha = texto.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (soloFecha) return soloFecha[1];

  const date = new Date(texto);
  if (!Number.isNaN(date.getTime())) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  }

  const match = texto.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function formatFecha(fecha: string | null | undefined): string {
  const iso = getFechaISO(fecha);
  if (!iso) return '-';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function formatFechaHoraRegistro(fecha: string | null | undefined): string {
  if (!fecha) return '-';
  const date = new Date(String(fecha));
  if (Number.isNaN(date.getTime())) {
    return formatFecha(fecha);
  }

  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function HistoricoClient({ planillas }: { planillas: any[] }) {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroVehiculo, setFiltroVehiculo] = useState<string>('todos');
  const [filtroOperador, setFiltroOperador] = useState<string>('todos');
  const [filtroTipoPago, setFiltroTipoPago] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  const vehiculos = useMemo(() => {
    return Array.from(new Set(planillas.map((p) => p.codigo_vehiculo).filter(Boolean))).sort();
  }, [planillas]);

  const operadores = useMemo(() => {
    return Array.from(
      new Set(
        planillas
          .map((p) => p.operador_nombre || p.operador_usuario || p.operador)
          .filter(Boolean)
      )
    ).sort();
  }, [planillas]);

  const planillasFiltradas = planillas.filter((p) => {
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchVehiculo = filtroVehiculo === 'todos' || p.codigo_vehiculo === filtroVehiculo;
    const operadorNombre = p.operador_nombre || p.operador_usuario || p.operador || '';
    const matchOperador = filtroOperador === 'todos' || operadorNombre === filtroOperador;
    const matchTipoPago = filtroTipoPago === 'todos' || p.tipo_pago === filtroTipoPago;

    const textoBusqueda = busqueda.trim().toLowerCase();
    const matchBusqueda =
      textoBusqueda === '' ||
      String(p.numero_planilla || '').toLowerCase().includes(textoBusqueda) ||
      String(p.conductor || '').toLowerCase().includes(textoBusqueda) ||
      String(p.codigo_vehiculo || '').toLowerCase().includes(textoBusqueda) ||
      String(operadorNombre).toLowerCase().includes(textoBusqueda);

    const fechaPlanilla = getFechaISO(p.created_at || p.fecha);
    const matchFechaDesde = !fechaDesde || (fechaPlanilla && fechaPlanilla >= fechaDesde);
    const matchFechaHasta = !fechaHasta || (fechaPlanilla && fechaPlanilla <= fechaHasta);

    return matchEstado && matchVehiculo && matchOperador && matchTipoPago && matchBusqueda && matchFechaDesde && matchFechaHasta;
  });

  const totalHistorico = planillasFiltradas.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);
  const totalContado = planillasFiltradas.filter((p) => p.tipo_pago === 'contado').length;
  const totalCredito = planillasFiltradas.filter((p) => p.tipo_pago === 'credito').length;

  function limpiarFiltros() {
    setFiltroEstado('todos');
    setFiltroVehiculo('todos');
    setFiltroOperador('todos');
    setFiltroTipoPago('todos');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
          <div className="flex flex-col gap-5 px-6 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Módulo histórico</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Histórico de planillas</h1>
              <p className="mt-2 text-sm text-white/80">Consulta las planillas ya liquidadas, pagadas o aprobadas.</p>
            </div>
            <a href="/dashboard" className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25">
              Volver
            </a>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
            <button
              onClick={() => setMostrarFiltrosAvanzados((prev) => !prev)}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {mostrarFiltrosAvanzados ? 'Ocultar avanzados' : 'Mostrar avanzados'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Buscar</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="N° planilla, conductor, operador o vehículo"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Fecha desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Fecha hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos</option>
                <option value="liquidada">Liquidadas</option>
                <option value="pagada">Pagadas</option>
                <option value="aprobada">Aprobadas</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Tipo de pago</label>
              <select
                value={filtroTipoPago}
                onChange={(e) => setFiltroTipoPago(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos</option>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Vehículo</label>
              <select
                value={filtroVehiculo}
                onChange={(e) => setFiltroVehiculo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos</option>
                {vehiculos.map((vehiculo) => (
                  <option key={vehiculo} value={vehiculo}>{vehiculo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Operador</label>
              <select
                value={filtroOperador}
                onChange={(e) => setFiltroOperador(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos</option>
                {operadores.map((operador) => (
                  <option key={operador} value={operador}>{operador}</option>
                ))}
              </select>
            </div>
          </div>

          {mostrarFiltrosAvanzados && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Tip: combina estado + tipo de pago + rango de fechas para obtener cortes más precisos por periodo.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">Mostrando {planillasFiltradas.length} de {planillas.length} planillas</span>
            <button
              onClick={limpiarFiltros}
              className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total histórico</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">${totalHistorico.toLocaleString('es-CO')}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Planillas contado</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">{totalContado}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Planillas crédito</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">{totalCredito}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Planillas históricas</h2>
            <p className="mt-1 text-sm text-slate-600">Registros ya liquidados, pagados o aprobados.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">N° Planilla</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Fecha registro</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Vehículo</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Conductor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Operador</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Tipo</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {planillasFiltradas.length > 0 ? (
                  planillasFiltradas.map((planilla: any) => (
                    <tr key={planilla.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{planilla.numero_planilla || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatFechaHoraRegistro(planilla.created_at || planilla.fecha)}</td>
                      <td className="px-4 py-3 text-slate-700">{planilla.codigo_vehiculo || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{planilla.conductor || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{planilla.operador_nombre || planilla.operador_usuario || planilla.operador || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          planilla.tipo_pago === 'contado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {planilla.tipo_pago || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${(parseFloat(String(planilla.valor)) || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          planilla.estado === 'liquidada' ? 'bg-blue-100 text-blue-800' :
                          planilla.estado === 'pagada' ? 'bg-emerald-100 text-emerald-800' :
                          planilla.estado === 'aprobada' ? 'bg-violet-100 text-violet-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {planilla.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                      No hay planillas que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
