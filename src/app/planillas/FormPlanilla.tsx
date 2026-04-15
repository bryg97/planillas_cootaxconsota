// Forzar redeploy tras corrección de JSX
// Forzar redeploy Vercel - sync visual
// Cambio menor para forzar redeploy en Vercel
'use client';

import { useState, useEffect } from 'react';

// Helper para formatear fecha a dd/mm/yyyy sin usar new Date() (evita problemas de timezone)
function formatFechaColombia(fecha: any): string {
  if (!fecha) return '';
  const fechaStr = fecha instanceof Date ? fecha.toISOString() : String(fecha);
  const match = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return fechaStr.substring(0, 10);
}
import { useOperadorSeleccionado } from '../hooks/useOperadorSeleccionado';
import { createPlanilla, verificarDeudaVehiculo, recaudarPlanillas, verificarNumeroPlanillaExiste } from './actions';
import { useSession } from 'next-auth/react';

export default function FormPlanilla({ 
  vehiculos,
  operadores = [],
  valorDefecto,
  onClose 
}: { 
  vehiculos: any[];
  operadores?: any[];
  valorDefecto?: number;
  onClose: () => void;
}) {
  // Obtener email del usuario autenticado desde sesión NextAuth
  const { data: session } = useSession();
  const email = session?.user?.email || '';
  const [operadorSeleccionado] = useOperadorSeleccionado(email);
  const [operadorForm, setOperadorForm] = useState<string>(operadorSeleccionado ? operadorSeleccionado.nombre : (operadores[0]?.nombre || ''));

  useEffect(() => {
    if (operadorSeleccionado) {
      setOperadorForm(operadorSeleccionado.nombre);
    } else if (operadores.length > 0) {
      setOperadorForm(operadores[0].nombre);
    }
  }, [operadorSeleccionado, operadores]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numeroPlanilla, setNumeroPlanilla] = useState('');
  const [valorPlanilla, setValorPlanilla] = useState(valorDefecto || 0);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
  const [vehiculoBusqueda, setVehiculoBusqueda] = useState('');
  const [deudaVehiculo, setDeudaVehiculo] = useState<any>(null);
  const [mostrarDetalleDeuda, setMostrarDetalleDeuda] = useState(false);
  const [planillasRecaudar, setPlanillasRecaudar] = useState<number[]>([]);
  const [tipoPago, setTipoPago] = useState('contado');
  const [saldoFavor, setSaldoFavor] = useState(0);
  const [usarSaldoFavor, setUsarSaldoFavor] = useState(false);
  const vehiculoActual = vehiculos.find((v) => v.id === parseInt(vehiculoSeleccionado || '0'));

  // Sin autollenado: el usuario debe ingresar manualmente el número de planilla

  async function handleVehiculoChange(vehiculoId: string) {
    setVehiculoSeleccionado(vehiculoId);
    setDeudaVehiculo(null);
    setMostrarDetalleDeuda(false);
    setPlanillasRecaudar([]);
    setSaldoFavor(0);
    setUsarSaldoFavor(false);
    if (vehiculoId) {
      const vehiculo = vehiculos.find((v) => v.id === parseInt(vehiculoId));

      // Verificar si el vehículo tiene deudas
      if (!vehiculo?.credito_sin_limite) {
        const deuda = await verificarDeudaVehiculo(parseInt(vehiculoId));
        if (deuda && deuda.total > 0) {
          setDeudaVehiculo(deuda);
          setMostrarDetalleDeuda(true);
          setPlanillasRecaudar(deuda.planillas.map((p: any) => p.id));
        }
      }

      // Buscar el saldo a favor del vehículo seleccionado
      if (vehiculo && vehiculo.saldo > 0) {
        setSaldoFavor(vehiculo.saldo);
      }
    }
  }

  function togglePlanillaRecaudar(planillaId: number) {
    setPlanillasRecaudar(prev =>
      prev.includes(planillaId)
        ? prev.filter(id => id !== planillaId)
        : [...prev, planillaId]
    );
  }

  async function handleContinuarConDeuda() {
    if (planillasRecaudar.length === 0) {
      setError('Debe seleccionar al menos una planilla para continuar');
      return;
    }

    setLoading(true);
    setError('');

    // Llamar a la acción para recaudar las planillas seleccionadas
    const result = await recaudarPlanillas(planillasRecaudar);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Si todo salió bien, cerrar el modal de deuda y permitir continuar
    setMostrarDetalleDeuda(false);
    setDeudaVehiculo(null);
    setLoading(false);
    
    // Mostrar mensaje de éxito
    alert(`✅ ${result.cantidad} planilla(s) recaudada(s) exitosamente. Ahora puede continuar con el registro.`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formElement = e.currentTarget; // Guardar referencia antes de cualquier await
      // Validar que el número de planilla sea solo números
      if (!numeroPlanilla || !/^\d+$/.test(numeroPlanilla)) {
        setError('El número de planilla es obligatorio y debe contener solo números');
        setLoading(false);
        return;
      }

      // Validar que el vehículo esté seleccionado
      if (!vehiculoSeleccionado) {
        setError('Debe seleccionar un vehículo');
        setLoading(false);
        return;
      }

      // Validar que el operador esté seleccionado
      if (!operadorForm) {
        setError('Debe seleccionar un operador');
        setLoading(false);
        return;
      }

      // Validar que el valor sea válido
      if (!valorPlanilla || valorPlanilla <= 0) {
        setError('El valor de la planilla debe ser mayor a 0');
        setLoading(false);
        return;
      }

      // Verificar si el número de planilla ya existe
      const existe = await verificarNumeroPlanillaExiste(numeroPlanilla);
      if (existe) {
        setError(`El número de planilla ${numeroPlanilla} ya está registrado. Por favor use otro número.`);
        setLoading(false);
        return;
      }

      const formData = new FormData(formElement);
      if (usarSaldoFavor) {
        formData.append('usar_saldo_favor', '1');
      }
      // Insertar el operador seleccionado automáticamente
      if (operadorForm) {
        formData.set('operador', operadorForm);
      }
      // Asegurar que el valor se envía correctamente
      formData.set('valor', valorPlanilla.toString());

      const result = await createPlanilla(formData);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        alert('✅ Planilla registrada exitosamente');
        onClose();
        window.location.reload();
      }
    } catch (err) {
      setError('Error al guardar la planilla: ' + String(err));
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
      {/* Modal de advertencia de deuda */}
      {mostrarDetalleDeuda && deudaVehiculo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-5 text-white">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/10 p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-100">Alerta</p>
                  <h3 className="mt-1 text-xl font-bold">Este vehículo tiene {deudaVehiculo.cantidad} planilla(s) pendiente(s)</h3>
                  <p className="mt-1 text-sm text-red-100">Debe recaudar antes de registrar una nueva planilla.</p>
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Planillas pendientes de pago</p>
                <div className="space-y-2">
                  {deudaVehiculo.planillas.map((planilla: any) => (
                    <label
                      key={planilla.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={planillasRecaudar.includes(planilla.id)}
                        onChange={() => togglePlanillaRecaudar(planilla.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">N° {planilla.numero_planilla}</p>
                        <p className="text-xs text-slate-500">{planilla.conductor} • {formatFechaColombia(planilla.fecha)}</p>
                      </div>
                      <p className="ml-2 text-sm font-bold text-red-600">${(parseFloat(String(planilla.valor)) || 0).toLocaleString('es-CO')}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-700">Total a recaudar</span>
                  <span className="text-2xl font-bold text-red-600">
                    ${deudaVehiculo.planillas
                      .filter((p: any) => planillasRecaudar.includes(p.id))
                      .reduce((sum: number, p: any) => sum + (parseFloat(String(p.valor)) || 0), 0)
                      .toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleContinuarConDeuda}
                  disabled={planillasRecaudar.length === 0}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {planillasRecaudar.length === 0
                    ? 'Seleccione al menos una planilla'
                    : `Confirmar recaudo de ${planillasRecaudar.length} planilla(s)`}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarDetalleDeuda(false)}
                  className="w-full rounded-2xl bg-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-5 text-white sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Nueva planilla</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Registro de planilla</h2>
            </div>
            <div className="text-sm text-white/70">Completa la información básica para registrar la planilla.</div>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6 sm:p-8">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Datos generales</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Operador *</label>
                    <select
                      name="operador"
                      value={operadorForm}
                      onChange={e => setOperadorForm(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccione un operador</option>
                      {operadores.map((op) => (
                        <option key={op.nombre} value={op.nombre}>{op.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Vehículo *</label>
                    <input
                      type="text"
                      placeholder="Buscar vehículo..."
                      value={vehiculoBusqueda}
                      onChange={e => setVehiculoBusqueda(e.target.value)}
                      className="mb-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <select
                      name="vehiculo_id"
                      value={vehiculoSeleccionado}
                      onChange={e => handleVehiculoChange(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccione un vehículo</option>
                      {vehiculos
                        .filter(v => v.codigo_vehiculo.toLowerCase().includes(vehiculoBusqueda.toLowerCase()))
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.codigo_vehiculo}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Conductor *</label>
                    <input
                      type="text"
                      name="conductor"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Nombre del conductor"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Fecha *</label>
                    <input
                      type="date"
                      name="fecha"
                      defaultValue={(function() {
                        const d = new Date();
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        return d.toISOString().split('T')[0];
                      })()}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      pattern="\\d{4}-\\d{2}-\\d{2}"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Tipo *</label>
                    <select
                      name="tipo_pago"
                      value={tipoPago}
                      onChange={e => setTipoPago(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="contado">Contado</option>
                      <option value="credito">Crédito</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Valor base</label>
                    <input
                      type="number"
                      name="valor"
                      step="0.01"
                      value={valorPlanilla}
                      onChange={(e) => setValorPlanilla(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">N° Planilla *</label>
                    <input
                      type="number"
                      name="numero_planilla"
                      value={numeroPlanilla}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNumeroPlanilla(value);
                      }}
                      required
                      min="1"
                      step="1"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Solo números"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Origen</label>
                    <input
                      type="text"
                      name="origen"
                      defaultValue={''}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Lugar de origen"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Destino</label>
                    <input
                      type="text"
                      name="destino"
                      defaultValue={''}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Lugar de destino"
                    />
                  </div>
                </div>
              </section>

              {vehiculoActual?.credito_sin_limite && (
                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 ring-1 ring-inset ring-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-blue-100 p-2 text-blue-700">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-950">
                      <p className="font-bold">Vehículo con crédito sin límite autorizado</p>
                      <p><span className="font-semibold">Autorizado por:</span> {vehiculoActual.autorizado_por_nombre || 'Sin registrar'}</p>
                      <p><span className="font-semibold">Identificación:</span> {vehiculoActual.autorizado_por_identificacion || 'Sin registrar'}</p>
                      <p>
                        <span className="font-semibold">Vigencia:</span> {vehiculoActual.autorizado_desde ? formatFechaColombia(vehiculoActual.autorizado_desde) : 'Sin fecha inicial'}
                        {' '}a{' '}
                        {vehiculoActual.autorizado_hasta ? formatFechaColombia(vehiculoActual.autorizado_hasta) : 'Sin fecha final'}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {saldoFavor > 0 && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 ring-1 ring-inset ring-emerald-100">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-900">Este vehículo tiene un saldo a favor de ${saldoFavor.toLocaleString('es-CO')}</p>
                      <label className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-inset ring-emerald-200">
                        <input
                          type="checkbox"
                          checked={usarSaldoFavor}
                          onChange={() => setUsarSaldoFavor(!usarSaldoFavor)}
                          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-emerald-800">Usar saldo a favor para pagar esta planilla</span>
                      </label>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumen rápido</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Tipo</div>
                    <div className="mt-1 font-semibold text-slate-900">{tipoPago}</div>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Valor</div>
                    <div className="mt-1 font-semibold text-slate-900">${valorPlanilla.toLocaleString('es-CO')}</div>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Saldo a favor</div>
                    <div className="mt-1 font-semibold text-slate-900">${saldoFavor.toLocaleString('es-CO')}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Acción principal</p>
                <p className="mt-2 text-sm text-slate-500">Registra la planilla con la información actual.</p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Registrar planilla'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </div>
  );
}
