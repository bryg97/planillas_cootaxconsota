// Forzar redeploy tras corrección de JSX
// Forzar redeploy Vercel - sync visual
// Cambio menor para forzar redeploy en Vercel
'use client';

import { useState, useEffect } from 'react';
import { useOperadorSeleccionado } from '../hooks/useOperadorSeleccionado';
import { createPlanilla, verificarDeudaVehiculo, recaudarPlanillas } from './actions';

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
  // Obtener email del usuario autenticado desde localStorage (ya que es client component)
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('supabase.auth.user') || 'null') : null;
  const email = user?.email || '';
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

  useEffect(() => {
    // Generar número de planilla automático
    const timestamp = Date.now().toString().slice(-8);
    setNumeroPlanilla(`PL-${timestamp}`);
  }, []);

  async function handleVehiculoChange(vehiculoId: string) {
    setVehiculoSeleccionado(vehiculoId);
    setDeudaVehiculo(null);
    setMostrarDetalleDeuda(false);
    setPlanillasRecaudar([]);
    setSaldoFavor(0);
    setUsarSaldoFavor(false);
    if (vehiculoId) {
      // Verificar si el vehículo tiene deudas
      const deuda = await verificarDeudaVehiculo(parseInt(vehiculoId));
      if (deuda && deuda.total > 0) {
        setDeudaVehiculo(deuda);
        setMostrarDetalleDeuda(true);
        setPlanillasRecaudar(deuda.planillas.map((p: any) => p.id));
      }
      // Buscar el saldo a favor del vehículo seleccionado
      const vehiculo = vehiculos.find((v) => v.id === parseInt(vehiculoId));
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

    const formData = new FormData(e.currentTarget);
    if (usarSaldoFavor) {
      formData.append('usar_saldo_favor', '1');
    }
    // Insertar el operador seleccionado automáticamente
    if (operadorForm) {
      formData.set('operador', operadorForm);
    }
    const result = await createPlanilla(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      window.location.reload();
    }
  }

  return (
    <div>
      {/* Modal de advertencia de deuda */}
      {mostrarDetalleDeuda && deudaVehiculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-red-400">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-bold text-red-800">
                  ⚠️ Este vehículo tiene {deudaVehiculo.cantidad} planilla(s) pendiente(s)
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Debe recaudar antes de registrar una nueva planilla
                </p>
              </div>
            </div>
            <div className="bg-white rounded p-3 mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Planillas pendientes de pago:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {deudaVehiculo.planillas.map((planilla: any) => (
                  <label
                    key={planilla.id}
                    className="flex items-start p-2 bg-gray-50 rounded border hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={planillasRecaudar.includes(planilla.id)}
                      onChange={() => togglePlanillaRecaudar(planilla.id)}
                      className="mt-1 mr-3 h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">N° {planilla.numero_planilla}</p>
                      <p className="text-xs text-gray-600">
                        {planilla.conductor} • {new Date(planilla.fecha).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <p className="font-bold text-red-600 ml-2">${planilla.valor.toLocaleString('es-CO')}</p>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded mb-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total a recaudar:</span>
                <span className="text-xl font-bold text-red-600">
                  ${deudaVehiculo.planillas
                    .filter((p: any) => planillasRecaudar.includes(p.id))
                    .reduce((sum: number, p: any) => sum + p.valor, 0)
                    .toLocaleString('es-CO')}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleContinuarConDeuda}
                disabled={planillasRecaudar.length === 0}
                className="w-full bg-green-600 text-white px-4 py-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {planillasRecaudar.length === 0 
                  ? 'Seleccione al menos una planilla' 
                  : `Confirmar recaudo de ${planillasRecaudar.length} planilla(s)`}
              </button>
              <button
                type="button"
                onClick={() => setMostrarDetalleDeuda(false)}
                className="w-full bg-gray-400 text-white px-4 py-3 rounded font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl p-10 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-blue-200">
        <h2 className="text-3xl font-extrabold mb-8 text-blue-700 tracking-tight flex items-center gap-2">
          <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva Planilla
        </h2>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Operador */}
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Operador *</label>
            <select
              name="operador"
              value={operadorForm}
              onChange={e => setOperadorForm(e.target.value)}
              required
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
            >
              <option value="">Seleccione un operador</option>
              {operadores.map((op) => (
                <option key={op.nombre} value={op.nombre}>{op.nombre}</option>
              ))}
            </select>
          </div>
          {/* Vehículo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Vehículo *</label>
            <input
              type="text"
              placeholder="Buscar vehículo..."
              value={vehiculoBusqueda}
              onChange={e => setVehiculoBusqueda(e.target.value)}
              className="w-full px-3 py-2 mb-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
            />
            <select
              name="vehiculo_id"
              value={vehiculoSeleccionado}
              onChange={e => handleVehiculoChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
            >
              <option value="">Seleccione un vehículo</option>
              {vehiculos
                .filter(v =>
                  v.codigo_vehiculo.toLowerCase().includes(vehiculoBusqueda.toLowerCase())
                )
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.codigo_vehiculo}
                  </option>
                ))}
            </select>
          </div>
          {/* Conductor */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Conductor *</label>
            <input
              type="text"
              name="conductor"
              required
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              placeholder="Nombre del conductor"
            />
          </div>
          {/* Tipo de Pago */}
          <div className="md:col-start-2 md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Tipo *</label>
            <select
              name="tipo_pago"
              value={tipoPago}
              onChange={e => setTipoPago(e.target.value)}
              required
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
            >
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          {/* Valor Planilla */}
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Valor Base</label>
            <input
              type="number"
              name="valor"
              step="0.01"
              value={valorPlanilla}
              onChange={(e) => setValorPlanilla(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              placeholder="0.00"
            />
          </div>
          {/* Número de Planilla */}
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">N° Planilla</label>
            <input
              type="text"
              name="numero_planilla"
              value={numeroPlanilla}
              onChange={(e) => setNumeroPlanilla(e.target.value)}
              required
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
            />
          </div>
          {/* Origen */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Origen</label>
            <input
              type="text"
              name="origen"
              defaultValue={''}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              placeholder="Lugar de origen"
            />
          </div>
          {/* Destino */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Destino</label>
            <input
              type="text"
              name="destino"
              defaultValue={''}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              placeholder="Lugar de destino"
            />
          </div>
        </div>
        {/* Notificación y opción de saldo a favor */}
        {saldoFavor > 0 && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 rounded">
            <div className="flex items-center mb-2">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="ml-2 font-bold text-green-800">Este vehículo tiene un saldo a favor de ${saldoFavor.toLocaleString('es-CO')}</span>
            </div>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={usarSaldoFavor}
                onChange={() => setUsarSaldoFavor(!usarSaldoFavor)}
                className="mr-2"
              />
              <span className="text-green-700">Usar saldo a favor para pagar esta planilla</span>
            </label>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Fecha *</label>
          <input
            type="date"
            name="fecha"
            defaultValue={(function() {
              const d = new Date();
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              return d.toISOString().split('T')[0];
            })()}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            pattern="\\d{4}-\\d{2}-\\d{2}"
          />
        </div>
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'Guardando...' : 'Registrar Planilla'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-3 rounded-xl font-bold shadow hover:from-gray-500 hover:to-gray-600 transition-all duration-200 text-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
