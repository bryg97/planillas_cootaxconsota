'use client';

import { useState } from 'react';
import { updatePlanilla } from './actions';

// Función para obtener fecha ISO para input date
function getFechaISO(fecha: any): string {
  if (!fecha) return '';
  const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString?.() || String(fecha);
  const match = fechaStr.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export default function EditarPlanilla({ 
  planilla,
  vehiculos,
  operadores,
  onClose 
}: { 
  planilla: any;
  vehiculos: any[];
  operadores: any[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.append('id', planilla.id.toString());
    
    const result = await updatePlanilla(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      window.location.reload();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Edición de planilla</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Editar Planilla</h2>
              <p className="mt-2 text-sm text-white/70">Ajusta la información registrada sin perder trazabilidad.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6 sm:p-8">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Datos de la planilla</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Número de planilla *</label>
                  <input
                    type="text"
                    name="numero_planilla"
                    defaultValue={planilla.numero_planilla}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Fecha *</label>
                  <input
                    type="date"
                    name="fecha"
                    defaultValue={getFechaISO(planilla.fecha)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Valor planilla *</label>
                  <input
                    type="number"
                    name="valor"
                    step="0.01"
                    defaultValue={planilla.valor}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tipo de pago *</label>
                  <select
                    name="tipo_pago"
                    defaultValue={planilla.tipo_pago}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Vehículo *</label>
                  <select
                    name="vehiculo_id"
                    defaultValue={String(planilla.vehiculo_id || '')}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione un vehículo</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.codigo_vehiculo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Operador *</label>
                  <select
                    name="operador"
                    defaultValue={planilla.operador}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione un operador</option>
                    {operadores.map((op) => (
                      <option key={op.id} value={op.nombre}>
                        {op.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Conductor *</label>
                  <input
                    type="text"
                    name="conductor"
                    defaultValue={planilla.conductor}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nombre del conductor"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Estado *</label>
                  <select
                    name="estado"
                    defaultValue={planilla.estado}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="recaudada">Recaudada</option>
                    <option value="liquidada">Liquidada</option>
                    <option value="pagada">Pagada</option>
                    <option value="aprobada">Aprobada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Origen</label>
                  <input
                    type="text"
                    name="origen"
                    defaultValue={planilla.origen || ''}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Lugar de origen"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Destino</label>
                  <input
                    type="text"
                    name="destino"
                    defaultValue={planilla.destino || ''}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Lugar de destino"
                  />
                </div>
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumen</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Planilla</div>
                    <div className="mt-1 font-semibold text-slate-900">{planilla.numero_planilla}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Vehículo</div>
                    <div className="mt-1 font-semibold text-slate-900">{vehiculos.find(v => String(v.id) === String(planilla.vehiculo_id))?.codigo_vehiculo || 'Sin asignar'}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Estado actual</div>
                    <div className="mt-1 font-semibold text-slate-900">{planilla.estado}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 ring-1 ring-inset ring-blue-100">
                <p className="text-sm font-semibold text-blue-950">Acciones</p>
                <p className="mt-2 text-sm text-blue-900/80">Guarda los cambios o cierra el formulario sin modificar la planilla.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
}
