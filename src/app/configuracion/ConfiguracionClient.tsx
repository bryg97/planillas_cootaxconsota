'use client';

import { useState, useEffect } from 'react';
import { updateConfiguracion, createOperador, deleteOperador, depurarVehiculos, eliminarPlanillasVehiculo, eliminarTodasPlanillas, updateOperador } from './actions';

export default function ConfiguracionClient({ 
  configuracion, 
  operadores,
  vehiculos
}: { 
  configuracion: any; 
  operadores: any[];
  vehiculos: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showFormOperador, setShowFormOperador] = useState(false);
  const [nuevoOperador, setNuevoOperador] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');

  // Estado para edición de operador
  const [showEditFormOperador, setShowEditFormOperador] = useState(false);
  const [editOperadorId, setEditOperadorId] = useState<number|null>(null);
  const [editOperadorNombre, setEditOperadorNombre] = useState('');
  const [editOperadorCorreo, setEditOperadorCorreo] = useState('');



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

  async function handleEliminarPlanillasVehiculo() {
    if (!vehiculoSeleccionado) {
      setError('Debe seleccionar un vehículo');
      return;
    }

    const vehiculo = vehiculos.find(v => v.id === parseInt(vehiculoSeleccionado));
    if (!confirm(`¿Está seguro de eliminar TODAS las planillas del vehículo ${vehiculo?.codigo_vehiculo}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await eliminarPlanillasVehiculo(parseInt(vehiculoSeleccionado));
    
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Planillas eliminadas correctamente');
      setVehiculoSeleccionado('');
      setTimeout(() => window.location.reload(), 1500);
    }
    
    setLoading(false);
  }

  async function handleEliminarTodasPlanillas() {
    if (!confirm('⚠️ ADVERTENCIA: ¿Está COMPLETAMENTE SEGURO de eliminar TODAS las planillas de TODOS los vehículos?\n\nEsta acción eliminará TODOS los registros del sistema y NO se puede deshacer.\n\n¿Desea continuar?')) {
      return;
    }

    // Segunda confirmación por seguridad
    if (!confirm('ÚLTIMA CONFIRMACIÓN: Se eliminarán TODOS los registros de planillas. ¿Proceder?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await eliminarTodasPlanillas();
    
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Todas las planillas fueron eliminadas');
      setTimeout(() => window.location.reload(), 2000);
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
                    <div>
                      <span className="font-medium">{op.nombre}</span>
                      <span className="ml-2 text-xs text-gray-500">{op.correo || ''}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditOperadorId(op.id);
                          setEditOperadorNombre(op.nombre);
                          setEditOperadorCorreo(op.correo || '');
                          setShowEditFormOperador(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteOperador(op.id, op.nombre)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
                // Estado para edición de operador
                const [showEditFormOperador, setShowEditFormOperador] = useState(false);
                const [editOperadorId, setEditOperadorId] = useState<number|null>(null);
                const [editOperadorNombre, setEditOperadorNombre] = useState('');
                const [editOperadorCorreo, setEditOperadorCorreo] = useState('');

                async function handleEditOperador(e: React.FormEvent<HTMLFormElement>) {
                  e.preventDefault();
                  if (!editOperadorId) return;
                  setLoading(true);
                  setError('');
                  setMessage('');
                  const formData = new FormData();
                  formData.append('id', String(editOperadorId));
                  formData.append('nombre', editOperadorNombre);
                  formData.append('correo', editOperadorCorreo);
                  const result = await updateOperador(formData);
                  if (result.error) {
                    setError(result.error);
                  } else {
                    setMessage('Operador actualizado correctamente');
                    setShowEditFormOperador(false);
                    setTimeout(() => window.location.reload(), 1000);
                  }
                  setLoading(false);
                }
                    {/* Formulario de edición de operador */}
                    {showEditFormOperador && (
                      <form onSubmit={handleEditOperador} className="mb-4 p-4 bg-gray-100 rounded shadow-lg fixed top-0 left-0 right-0 max-w-md mx-auto z-50 mt-24">
                        <h3 className="font-semibold mb-2">Editar Operador</h3>
                        <input
                          type="text"
                          name="nombre"
                          value={editOperadorNombre}
                          onChange={e => setEditOperadorNombre(e.target.value)}
                          placeholder="Nombre del operador"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                        <input
                          type="email"
                          name="correo"
                          value={editOperadorCorreo}
                          onChange={e => setEditOperadorCorreo(e.target.value)}
                          placeholder="Correo electrónico"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEditFormOperador(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Guardar
                          </button>
                        </div>
                      </form>
                    )}
              ) : (
                <p className="text-gray-500 text-center py-4">No hay operadores registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Depuración */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Mantenimiento y Depuración</h2>
          
          <div className="space-y-4">
            {/* Eliminar planillas de un vehículo específico */}
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-medium text-gray-900 mb-2">Eliminar planillas de un vehículo</h3>
              <p className="text-sm text-gray-600 mb-3">Elimina todas las planillas de un vehículo específico para empezar desde cero</p>
              
              <div className="flex gap-2">
                <select
                  value={vehiculoSeleccionado}
                  onChange={(e) => setVehiculoSeleccionado(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.codigo_vehiculo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleEliminarPlanillasVehiculo}
                  disabled={loading || !vehiculoSeleccionado}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Eliminar Planillas
                </button>
              </div>
            </div>

            {/* Eliminar todas las planillas */}
            <div className="p-4 bg-red-50 rounded border border-red-300">
              <h3 className="font-medium text-red-900 mb-2">⚠️ Eliminar TODAS las planillas</h3>
              <p className="text-sm text-red-700 mb-3">
                <strong>PELIGRO:</strong> Elimina TODOS los registros de planillas de TODOS los vehículos del sistema. Esta acción NO se puede deshacer.
              </p>
              <button
                onClick={handleEliminarTodasPlanillas}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold"
              >
                🗑️ Eliminar Todo
              </button>
            </div>

            {/* Depurar vehículos sin planillas */}
            <div className="p-4 bg-yellow-50 rounded border border-yellow-300">
              <h3 className="font-medium text-gray-900 mb-2">Depurar Vehículos</h3>
              <p className="text-sm text-gray-600 mb-3">Elimina vehículos que no tienen planillas asociadas</p>
              <button
                onClick={handleDepurar}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Depurar Ahora
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
