'use client';

import { useState } from 'react';
import ImportarPlanillasModal from './ImportarPlanillasModal';
import FormPlanilla from './FormPlanilla';
import VerPlanilla from './VerPlanilla';
import EditarPlanilla from './EditarPlanilla';
import { eliminarPlanilla } from './actions';

// Función para formatear fecha en formato Colombia (dd/mm/yyyy)
function formatFechaColombia(fecha: any): string {
  if (!fecha) return '';
  // Si es string ISO (2026-01-06) o Date object
  const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString?.() || String(fecha);
  // Extraer solo la parte de fecha YYYY-MM-DD
  const match = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`; // dd/mm/yyyy
  }
  return fechaStr;
}

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

  const totalValorFiltrado = planillasFiltradas.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);
  const totalPendientes = planillasFiltradas.filter((p) => p.estado === 'pendiente').length;
  const totalRecaudadas = planillasFiltradas.filter((p) => p.estado === 'recaudada').length;

  function exportarPlanillas() {
    if (planillasFiltradas.length === 0) {
      alert('No hay planillas para exportar');
      return;
    }

    // Preparar datos para exportar
    const datos = planillasFiltradas.map(p => ({
      'N° Planilla': p.numero_planilla || '',
      'Fecha': p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '',
      'Vehículo': p.vehiculos?.codigo_vehiculo || '',
      'Conductor': p.conductor || '',
      'Operador': p.operador || '',
      'Valor': p.valor || 0,
      'Tipo Pago': p.tipo_pago || '',
      'Estado': p.estado || '',
      'Origen': p.origen || '',
      'Destino': p.destino || '',
      'Fecha Creación': p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : ''
    }));

    // Convertir a CSV
    const headers = Object.keys(datos[0]);
    const csvContent = [
      headers.join(','),
      ...datos.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapar valores que contengan comas o comillas
          const stringValue = typeof value === 'number' ? value.toString() : String(value);
          return stringValue.includes(',') || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Crear archivo y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `planillas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                Planillas
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Gestión de planillas</h1>
              <p className="mt-2 text-sm text-slate-200 sm:text-base">Consulta, crea, importa y exporta planillas desde un panel más ordenado.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                + Nueva planilla
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Importar
              </button>
              <button
                onClick={exportarPlanillas}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Exportar
              </button>
              <a href="/dashboard" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                Volver
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Planillas visibles</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{planillasFiltradas.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Valor total</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">${totalValorFiltrado.toLocaleString('es-CO')}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{totalPendientes}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recaudadas</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{totalRecaudadas}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Buscar planilla</label>
            <input
              type="text"
              placeholder="Buscar por N° planilla, conductor, vehículo, tipo o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {busqueda && (
              <p className="mt-2 text-sm text-slate-600">
                Mostrando {planillasFiltradas.length} de {planillas.length} planillas
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Vehículo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Conductor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Operador</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {planillasFiltradas && planillasFiltradas.length > 0 ? (
                    planillasFiltradas.map((planilla: any) => (
                      <tr key={planilla.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{planilla.numero_planilla}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatFechaColombia(planilla.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{planilla.vehiculos?.codigo_vehiculo || ''}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{planilla.conductor || ''}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{planilla.operador || ''}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            planilla.tipo_pago === 'contado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {planilla.tipo_pago || ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          ${(parseFloat(planilla.valor) || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' :
                            planilla.estado === 'pagada' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {planilla.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => setPlanillaVer(planilla)}
                            className="mr-3 font-semibold text-blue-600 transition hover:text-blue-800"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => setPlanillaEditar(planilla)}
                            className="mr-3 font-semibold text-emerald-600 transition hover:text-emerald-800"
                          >
                            Editar
                          </button>
                          {rol === 'administrador' && (
                            <button
                              onClick={() => handleEliminar(planilla.id, planilla.numero_planilla)}
                              className="font-semibold text-red-600 transition hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                        No hay planillas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

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
