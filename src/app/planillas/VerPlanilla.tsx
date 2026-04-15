'use client';

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

// Función para obtener fecha ISO para input date
function getFechaISO(fecha: any): string {
  if (!fecha) return '';
  const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString?.() || String(fecha);
  const match = fechaStr.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export default function VerPlanilla({ 
  planilla, 
  onClose 
}: { 
  planilla: any; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Consulta de planilla</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Detalles de Planilla</h2>
              <p className="mt-2 text-sm text-white/70">Vista consolidada con la información principal y trazabilidad del registro.</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Número</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{planilla.numero_planilla}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatFechaColombia(planilla.fecha)}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Valor</p>
              <p className="mt-2 text-xl font-bold text-emerald-600">${(parseFloat(planilla.valor) || 0).toLocaleString('es-CO')}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' :
                planilla.estado === 'pagada' ? 'bg-emerald-100 text-emerald-800' :
                planilla.estado === 'liquidada' ? 'bg-violet-100 text-violet-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {planilla.estado}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Información general</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehículo</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{planilla.vehiculos?.codigo_vehiculo || ''}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conductor</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{planilla.conductor || ''}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operador</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{planilla.operador || '-'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de pago</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    planilla.tipo_pago === 'contado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {planilla.tipo_pago || ''}
                  </span>
                </div>

                {planilla.origen && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origen</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{planilla.origen}</p>
                  </div>
                )}

                {planilla.destino && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destino</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{planilla.destino}</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Trazabilidad</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {planilla.usuarios?.usuario && (
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Creado por</p>
                      <p className="mt-1 font-semibold text-slate-900">{planilla.usuarios.usuario}</p>
                    </div>
                  )}

                  {planilla.recaudada_por && (
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Recaudada por</p>
                      <p className="mt-1 font-semibold text-slate-900">{planilla.recaudada_por}</p>
                    </div>
                  )}

                  {planilla.created_at && (
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Fecha de creación</p>
                      <p className="mt-1 font-semibold text-slate-900">{new Date(planilla.created_at).toLocaleString('es-CO')}</p>
                    </div>
                  )}

                  {planilla.fecha_recaudacion && (
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Fecha de recaudación</p>
                      <p className="mt-1 font-semibold text-slate-900">{new Date(planilla.fecha_recaudacion).toLocaleString('es-CO')}</p>
                    </div>
                  )}
                </div>
              </div>

              {planilla.observaciones && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Observaciones</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{planilla.observaciones}</p>
                </div>
              )}
            </aside>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
