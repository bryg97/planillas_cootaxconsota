'use client';

import { useState, useEffect } from 'react';
import { createPlanilla, verificarDeudaVehiculo } from './actions';

export default function FormPlanilla({ 
  vehiculos,
  operadores,
  valorDefecto,
  onClose 
}: { 
  vehiculos: any[];
  operadores: any[];
  valorDefecto?: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numeroPlanilla, setNumeroPlanilla] = useState('');
  const [valorPlanilla, setValorPlanilla] = useState(valorDefecto || 0);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
  const [deudaVehiculo, setDeudaVehiculo] = useState<any>(null);
  const [mostrarDetalleDeuda, setMostrarDetalleDeuda] = useState(false);
  const [planillasRecaudar, setPlanillasRecaudar] = useState<number[]>([]);
  const [tipoPago, setTipoPago] = useState('contado');

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
    
    if (vehiculoId) {
      // Verificar si el vehículo tiene deudas
      const deuda = await verificarDeudaVehiculo(parseInt(vehiculoId));
      if (deuda && deuda.total > 0) {
        setDeudaVehiculo(deuda);
        setMostrarDetalleDeuda(true);
        // Por defecto seleccionar todas
        setPlanillasRecaudar(deuda.planillas.map((p: any) => p.id));
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
      setError('Debe recaudar al menos una planilla para continuar');
      return;
    }
    // Aquí puedes agregar lógica adicional si es necesario
    setMostrarDetalleDeuda(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Nueva Planilla</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Planilla *
            </label>
            <input
              type="text"
              name="numero_planilla"
              value={numeroPlanilla}
              onChange={(e) => setNumeroPlanilla(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              name="fecha"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Planilla *
            </label>
            <input
              type="number"
              name="valor"
              step="0.01"
              value={valorPlanilla}
              onChange={(e) => setValorPlanilla(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehículo *
            </label>
            <select
              name="vehiculo_id"
              value={vehiculoSeleccionado}
              onChange={(e) => handleVehiculoChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un vehículo</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.codigo_vehiculo}
                </option>
              ))}
            </select>
          </div>

          {mostrarDetalleDeuda && deudaVehiculo && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded">
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
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pago *
            </label>
            <select
              name="tipo_pago"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conductor *
            </label>
            <input
              type="text"
              name="conductor"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del conductor"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operador *
            </label>
            <select
              name="operador"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un operador</option>
              {operadores.map((op) => (
                <option key={op.id} value={op.nombre}>
                  {op.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
