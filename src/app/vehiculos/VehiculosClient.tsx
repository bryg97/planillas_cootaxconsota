'use client';

import { useState } from 'react';
import FormVehiculo from './FormVehiculo';
import VerVehiculo from './VerVehiculo';
import EditarVehiculo from './EditarVehiculo';

export default function VehiculosClient({ vehiculos }: { vehiculos: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [showVer, setShowVer] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar vehículos por búsqueda
  const vehiculosFiltrados = vehiculos?.filter(v => 
    v.codigo_vehiculo?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  function handleVer(vehiculo: any) {
    setVehiculoSeleccionado(vehiculo);
    setShowVer(true);
  }

  function handleEditar(vehiculo: any) {
    setVehiculoSeleccionado(vehiculo);
    setShowEditar(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Registro de Vehículos</h2>
              <div className="flex gap-3">
                <a
                  href="/vehiculos/importar"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  📂 Importar Excel
                </a>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + Nuevo Vehículo
                </button>
              </div>
            </div>
            
            {/* Campo de búsqueda */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por código de vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Pendiente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehiculosFiltrados && vehiculosFiltrados.length > 0 ? (
                  vehiculosFiltrados.map((vehiculo: any) => (
                    <tr key={vehiculo.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehiculo.codigo_vehiculo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(vehiculo.saldo).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`${vehiculo.saldo_pendiente > 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          ${parseFloat(vehiculo.saldo_pendiente).toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vehiculo.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleVer(vehiculo)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver
                        </button>
                        <button 
                          onClick={() => handleEditar(vehiculo)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No hay vehículos registrados
      {showVer && vehiculoSeleccionado && (
        <VerVehiculo 
          vehiculo={vehiculoSeleccionado} 
          onClose={() => setShowVer(false)} 
        />
      )}
      {showEditar && vehiculoSeleccionado && (
        <EditarVehiculo 
          vehiculo={vehiculoSeleccionado} 
          onClose={() => setShowEditar(false)} 
        />
      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm && <FormVehiculo onClose={() => setShowForm(false)} />}
    </div>
  );
}
