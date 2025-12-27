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
  const [mostrarAlertaDeuda, setMostrarAlertaDeuda] = useState(false);

  useEffect(() => {
    // Generar número de planilla automático
    const timestamp = Date.now().toString().slice(-8);
    setNumeroPlanilla(`PL-${timestamp}`);
  }, []);

  async function handleVehiculoChange(vehiculoId: string) {
    setVehiculoSeleccionado(vehiculoId);
    
    if (vehiculoId) {
      // Verificar si el vehículo tiene deudas
      const deuda = await verificarDeudaVehiculo(parseInt(vehiculoId));
      if (deuda && deuda.total > 0) {
        setDeudaVehiculo(deuda);
        setMostrarAlertaDeuda(true);
      } else {
        setDeudaVehiculo(null);
        setMostrarAlertaDeuda(false);
      }
    }
  }

  async function handleRecaudarDeuda() {
    // Marcar como recaudada y continuar
    setMostrarAlertaDeuda(false);
    // La planilla se creará con nota de recaudo
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

          {mostrarAlertaDeuda && deudaVehiculo && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Vehículo con deuda pendiente
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Este vehículo debe ${deudaVehiculo.total.toLocaleString('es-CO')} de {deudaVehiculo.planillas} planilla(s) a crédito.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleRecaudarDeuda}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 mr-2"
                    >
                      Recaudar ahora
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarAlertaDeuda(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                    >
                      Continuar sin recaudar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pago *
            </label>
            <select
              name="tipo_pago"
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
