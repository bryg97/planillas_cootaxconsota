'use client';

import { useState } from 'react';
import ImportarPlanillasModal from './ImportarPlanillasModal';
import FormPlanilla from './FormPlanilla';
import VerPlanilla from './VerPlanilla';
import EditarPlanilla from './EditarPlanilla';
import { eliminarPlanilla } from './actions';

export default function PlanillasClient({ planillas, vehiculos, operadores, valorDefecto, rol }: { planillas: any[]; vehiculos: any[]; operadores: any[]; valorDefecto?: number; rol: string }) {
  const [showForm, setShowForm] = useState(false);
  const [planillaVer, setPlanillaVer] = useState<any>(null);
  const [planillaEditar, setPlanillaEditar] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  async function handleEliminar(planillaId: number, numeroPlanilla: string) {
    if (!confirm(`¿Estás seguro de eliminar la planilla N° ${numeroPlanilla}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const result = await eliminarPlanilla(planillaId);
    
    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      alert('Planilla eliminada correctamente');
      window.location.reload();
    }
  }

  // Filtrar planillas según búsqueda
  const planillasFiltradas = planillas.filter(p => {
    const textoBusqueda = busqueda.toLowerCase();
    return (
      p.numero_planilla?.toLowerCase().includes(textoBusqueda) ||
      p.conductor?.toLowerCase().includes(textoBusqueda) ||
      p.vehiculos?.codigo_vehiculo?.toLowerCase().includes(textoBusqueda) ||
      p.tipo_pago?.toLowerCase().includes(textoBusqueda) ||
      p.estado?.toLowerCase().includes(textoBusqueda)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Planillas</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h2 className="text-xl font-semibold">Gestión de Planillas</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Nueva Planilla
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Importar planillas
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <input
              type="text"
              placeholder="🔍 Buscar por N° planilla, conductor, vehículo, tipo o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {busqueda && (
              <p className="mt-2 text-sm text-gray-600">
                Mostrando {planillasFiltradas.length} de {planillas.length} planillas
              </p>
            )}
          </div>
      {showImport && (
        <ImportarPlanillasModal 
          onClose={() => setShowImport(false)}
          onImport={async (data) => {
            try {
              const res = await fetch('/api/importar-planillas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planillas: data })
              });
              const json = await res.json();
              if (json.success) {
                alert('✅ ' + json.cantidad + ' planillas importadas correctamente.');
                window.location.reload();
              } else {
                alert('Error: ' + (json.error || 'Error desconocido.'));
              }
            } catch (e: any) {
              alert('Error: ' + (e.message || 'Error inesperado.'));
            }
            setShowImport(false);
          }}
        />
      )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Planilla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planillasFiltradas && planillasFiltradas.length > 0 ? (
                  planillasFiltradas.map((planilla: any) => (
                    <tr key={planilla.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {planilla.numero_planilla}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {planilla.fecha ? planilla.fecha.substring(0, 10).split('-').reverse().join('/') : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {planilla.vehiculos?.codigo_vehiculo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {planilla.conductor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          planilla.tipo_pago === 'contado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {planilla.tipo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(planilla.valor).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' :
                          planilla.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {planilla.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => setPlanillaVer(planilla)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver
                        </button>
                        <button 
                          onClick={() => setPlanillaEditar(planilla)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Editar
                        </button>
                        {rol === 'administrador' && (
                          <button 
                            onClick={() => handleEliminar(planilla.id, planilla.numero_planilla)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No hay planillas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <FormPlanilla 
            vehiculos={vehiculos}
            operadores={operadores}
            valorDefecto={valorDefecto}
            onClose={() => setShowForm(false)} 
          />
        </div>
      )}

      {planillaVer && (
        <VerPlanilla 
          planilla={planillaVer}
          onClose={() => setPlanillaVer(null)} 
        />
      )}

      {planillaEditar && (
        <EditarPlanilla 
          planilla={planillaEditar}
          vehiculos={vehiculos}
          operadores={operadores}
          onClose={() => setPlanillaEditar(null)} 
        />
      )}
    </div>
  );
}
