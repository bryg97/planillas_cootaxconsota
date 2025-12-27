'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OperacionesClient({ 
  planillasHoy, 
  misLiquidaciones,
  stats,
  usuario
}: { 
  planillasHoy: any[];
  misLiquidaciones: any[];
  stats: any;
  usuario: any;
}) {
  const [filtro, setFiltro] = useState<string>('todas');

  const planillasFiltradas = planillasHoy.filter((p) => {
    if (filtro === 'todas') return true;
    if (filtro === 'contado') return p.tipo_pago === 'contado';
    if (filtro === 'credito') return p.tipo_pago === 'credito';
    if (filtro === 'pendientes') return p.estado === 'pendiente';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Operaciones</h1>
            <p className="text-sm text-gray-600 mt-1">
              Vista rápida de las operaciones del día • {usuario?.usuario}
            </p>
          </div>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Acciones Rápidas */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/planillas"
            className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Nueva Planilla</h3>
                <p className="text-sm text-blue-100">Registrar nueva planilla</p>
              </div>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>

          <Link 
            href="/liquidaciones"
            className="bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Liquidar</h3>
                <p className="text-sm text-purple-100">Crear liquidación</p>
              </div>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </Link>

          <Link 
            href="/planillas"
            className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Ver Planillas</h3>
                <p className="text-sm text-green-100">Todas las planillas</p>
              </div>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Estadísticas del Día */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Resumen del Día - {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Planillas</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="bg-gray-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Recaudado Hoy</h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    ${stats.recaudado.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">De Contado</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.contado}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">A Crédito</h3>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.credito}</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.pendientes}</p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mis Liquidaciones Pendientes */}
        {misLiquidaciones.length > 0 && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-yellow-800">
                  Tienes {misLiquidaciones.length} liquidación(es) pendiente(s) de aprobación
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Estas liquidaciones están esperando ser revisadas por la tesorera.
                </p>
                <Link 
                  href="/liquidaciones"
                  className="mt-3 inline-block text-yellow-800 font-medium underline hover:text-yellow-900"
                >
                  Ver mis liquidaciones →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Planillas del Día */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Planillas de Hoy</h2>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltro('todas')}
                  className={`px-3 py-1 rounded text-sm ${
                    filtro === 'todas' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFiltro('contado')}
                  className={`px-3 py-1 rounded text-sm ${
                    filtro === 'contado' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Contado
                </button>
                <button
                  onClick={() => setFiltro('credito')}
                  className={`px-3 py-1 rounded text-sm ${
                    filtro === 'credito' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Crédito
                </button>
                <button
                  onClick={() => setFiltro('pendientes')}
                  className={`px-3 py-1 rounded text-sm ${
                    filtro === 'pendientes' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pendientes
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Planilla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planillasFiltradas.length > 0 ? (
                  planillasFiltradas.map((planilla: any) => (
                    <tr key={planilla.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {planilla.numero_planilla}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {planilla.vehiculos?.codigo_vehiculo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {planilla.conductor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          planilla.tipo_pago === 'contado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {planilla.tipo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${parseFloat(planilla.valor.toString()).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' :
                          planilla.estado === 'liquidada' ? 'bg-purple-100 text-purple-800' :
                          planilla.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {planilla.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {filtro === 'todas' 
                        ? 'No hay planillas registradas hoy' 
                        : `No hay planillas ${filtro === 'pendientes' ? 'pendientes' : 'de ' + filtro} hoy`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
