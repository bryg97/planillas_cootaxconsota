'use client';

import { useState } from 'react';
import { updateVehiculo } from './actions';


interface EditarVehiculoProps {
  vehiculo: any;
  onClose: () => void;
  readOnly?: boolean;
}

export default function EditarVehiculo({ vehiculo, onClose, readOnly = false }: EditarVehiculoProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creditoSinLimite, setCreditoSinLimite] = useState(Boolean(vehiculo.credito_sin_limite));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await updateVehiculo(vehiculo.id, formData);

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
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">{readOnly ? 'Detalles del Vehículo' : 'Editar Vehículo'}</h2>
        {vehiculo.saldo_pendiente > 0 && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 font-semibold text-center">
            ¡Este vehículo tiene deuda pendiente! Debe recaudar antes de editar.
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código del Vehículo *
            </label>
            <input
              type="text"
              name="codigo_vehiculo"
              defaultValue={vehiculo.codigo_vehiculo}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: TXI-123"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo
            </label>
            <input
              type="number"
              name="saldo"
              step="0.01"
              defaultValue={vehiculo.saldo}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo Pendiente
            </label>
            <input
              type="number"
              name="saldo_pendiente"
              step="0.01"
              defaultValue={vehiculo.saldo_pendiente}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="credito_sin_limite"
                value="1"
                defaultChecked={creditoSinLimite}
                onChange={(e) => setCreditoSinLimite(e.target.checked)}
                className="h-4 w-4"
                disabled={readOnly}
              />
              Crédito sin límite
            </label>
          </div>

          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Formulario de autorización</p>
            <p className="text-xs text-blue-700 mb-3">
              Diligencie quién autoriza el crédito. Estos datos son obligatorios cuando activa "Crédito sin límite".
            </p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de quien autoriza {creditoSinLimite ? '*' : ''}
              </label>
              <input
                type="text"
                name="autorizado_por_nombre"
                defaultValue={vehiculo.autorizado_por_nombre || ''}
                required={creditoSinLimite && !readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identificación de quien autoriza {creditoSinLimite ? '*' : ''}
              </label>
              <input
                type="text"
                name="autorizado_por_identificacion"
                defaultValue={vehiculo.autorizado_por_identificacion || ''}
                required={creditoSinLimite && !readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cédula / NIT"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha inicial {creditoSinLimite ? '*' : ''}
                </label>
                <input
                  type="date"
                  name="autorizado_desde"
                  defaultValue={vehiculo.autorizado_desde ? String(vehiculo.autorizado_desde).slice(0, 10) : ''}
                  required={creditoSinLimite && !readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly={readOnly}
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha final
                </label>
                <input
                  type="date"
                  name="autorizado_hasta"
                  defaultValue={vehiculo.autorizado_hasta ? String(vehiculo.autorizado_hasta).slice(0, 10) : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly={readOnly}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
