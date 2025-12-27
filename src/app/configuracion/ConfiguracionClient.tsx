'use client';

import { useState, useEffect } from 'react';
import { updateConfiguracion, createOperador, deleteOperador, depurarVehiculos } from './actions';

export default function ConfiguracionClient({ 
  configuracion, 
  operadores 
}: { 
  configuracion: any; 
  operadores: any[] 
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showFormOperador, setShowFormOperador] = useState(false);
  const [nuevoOperador, setNuevoOperador] = useState('');

  async function handleSubmitConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await updateConfiguracion(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Configuración guardada correctamente');
      setTimeout(() => window.location.reload(), 1000);
    }

    setLoading(false);
  }

  async function handleCreateOperador(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createOperador(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Operador creado correctamente');
      setShowFormOperador(false);
      setNuevoOperador('');
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  async function handleDeleteOperador(id: number, nombre: string) {
    if (!confirm(`¿Eliminar operador ${nombre}?`)) return;

    const result = await deleteOperador(id);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Operador eliminado');
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  async function handleDepurar() {
    if (!confirm('¿Está seguro de depurar vehículos sin planillas? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    const result = await depurarVehiculos();
    
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Depuración completada');
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración General */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configuración General</h2>
            
            <form onSubmit={handleSubmitConfig}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Planilla Predeterminado
                </label>
                <input
                  type="number"
                  name="valor_planilla_defecto"
                  step="0.01"
                  defaultValue={configuracion?.valor_planilla_defecto || 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal de Telegram
                </label>
                <input
                  type="text"
                  name="canal_telegram"
                  defaultValue={configuracion?.canal_telegram || ''}
                  placeholder="@canal_planillas"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot de Telegram
                </label>
                <input
                  type="text"
                  name="bot_telegram"
                  defaultValue={configuracion?.bot_telegram || ''}
                  placeholder="Token del bot"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </form>
          </div>

          {/* Operadores */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Operadores</h2>
              <button
                onClick={() => setShowFormOperador(!showFormOperador)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Agregar
              </button>
            </div>

            {showFormOperador && (
              <form onSubmit={handleCreateOperador} className="mb-4 p-4 bg-gray-50 rounded">
                <input
                  type="text"
                  name="nombre"
                  value={nuevoOperador}
                  onChange={(e) => setNuevoOperador(e.target.value)}
                  placeholder="Nombre del operador"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormOperador(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Crear
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {operadores && operadores.length > 0 ? (
                operadores.map((op: any) => (
                  <div
                    key={op.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{op.nombre}</span>
                    <button
                      onClick={() => handleDeleteOperador(op.id, op.nombre)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay operadores registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Depuración */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Mantenimiento</h2>
          
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded">
            <div>
              <h3 className="font-medium text-gray-900">Depurar Vehículos</h3>
              <p className="text-sm text-gray-600">Elimina vehículos que no tienen planillas asociadas</p>
            </div>
            <button
              onClick={handleDepurar}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Depurar Ahora
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
