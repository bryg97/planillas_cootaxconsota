'use client';

import { useState } from 'react';
import FormVehiculo from './FormVehiculo';
import EditarVehiculo from './EditarVehiculo';
import { deleteVehiculo } from './actions';

export default function VehiculosClient({ vehiculos }: { vehiculos: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [showVer, setShowVer] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null);
  const [showRecaudoModal, setShowRecaudoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehiculoEliminar, setVehiculoEliminar] = useState<any>(null);

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

  function handleEliminar(vehiculo: any) {
    setVehiculoEliminar(vehiculo);
    setShowDeleteConfirm(true);
  }

  async function confirmarEliminacion() {
    if (!vehiculoEliminar) return;

    const result = await deleteVehiculo(vehiculoEliminar.id);
    
    if (result.error) {
      alert(`❌ ${result.error}`);
    } else {
      alert('✅ Vehículo eliminado exitosamente');
      window.location.reload();
    }
    
    setShowDeleteConfirm(false);
    setVehiculoEliminar(null);
  }

  const totalVehiculos = vehiculosFiltrados.length;
  const vehiculosConDeuda = vehiculosFiltrados.filter((vehiculo: any) => Number(vehiculo.saldo_pendiente) > 0).length;
  const vehiculosSinLimite = vehiculosFiltrados.filter((vehiculo: any) => Boolean(vehiculo.credito_sin_limite)).length;
  const saldoPendienteTotal = vehiculosFiltrados.reduce((acc: number, vehiculo: any) => acc + (parseFloat(String(vehiculo.saldo_pendiente)) || 0), 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_30%),radial-gradient(circle_at_82%_20%,_rgba(16,185,129,0.13),_transparent_24%),linear-gradient(145deg,_#08111f_0%,_#0d1730_45%,_#101c38_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-7rem] top-[14rem] h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 text-white shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Módulo de vehículos
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Control de flota y crédito</h1>
              <p className="mt-2 text-sm text-slate-200">
                Administra saldos, condiciones de crédito y estado de cartera por vehículo en un solo panel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                ← Volver al Dashboard
              </a>
              <a
                href="/vehiculos/importar"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                📂 Importar Excel
              </a>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                + Nuevo vehículo
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/15 bg-white/95 p-5 shadow-xl shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vehículos visibles</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totalVehiculos}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/95 p-5 shadow-xl shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Con deuda</p>
            <p className="mt-2 text-3xl font-black text-rose-600">{vehiculosConDeuda}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/95 p-5 shadow-xl shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Crédito sin límite</p>
            <p className="mt-2 text-3xl font-black text-cyan-700">{vehiculosSinLimite}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/95 p-5 shadow-xl shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saldo pendiente total</p>
            <p className="mt-2 text-3xl font-black text-slate-900">${saldoPendienteTotal.toLocaleString('es-CO')}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/95 p-6 shadow-xl shadow-slate-950/20">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Buscar vehículo</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por código de vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Crédito</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Saldo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Saldo pendiente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Fecha registro</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {vehiculosFiltrados && vehiculosFiltrados.length > 0 ? (
                    vehiculosFiltrados.map((vehiculo: any) => (
                      <tr key={vehiculo.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {vehiculo.codigo_vehiculo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {vehiculo.credito_sin_limite ? (
                            <span className="inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                              Sin límite
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              Estándar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          ${(parseFloat(String(vehiculo.saldo)) || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`${Number(vehiculo.saldo_pendiente) > 0 ? 'font-semibold text-rose-600' : 'text-slate-900'}`}>
                            ${(parseFloat(String(vehiculo.saldo_pendiente)) || 0).toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(vehiculo.created_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleVer(vehiculo)}
                            className="mr-3 font-semibold text-blue-600 transition hover:text-blue-800"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditar(vehiculo)}
                            className="mr-3 font-semibold text-emerald-600 transition hover:text-emerald-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(vehiculo)}
                            className="font-semibold text-rose-600 transition hover:text-rose-800"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        No hay vehículos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {showForm && <FormVehiculo onClose={() => setShowForm(false)} />}
      {showVer && vehiculoSeleccionado && (
        <EditarVehiculo 
          vehiculo={vehiculoSeleccionado} 
          onClose={() => setShowVer(false)} 
          readOnly={true}
        />
      )}
      {showEditar && vehiculoSeleccionado && (
        <EditarVehiculo 
          vehiculo={vehiculoSeleccionado} 
          onClose={() => setShowEditar(false)} 
        />
      )}
      {showRecaudoModal && vehiculoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold mb-4 text-yellow-700">¡Recaudo Obligatorio!</h2>
            <p className="mb-4 text-gray-700">El vehículo <b>{vehiculoSeleccionado.codigo_vehiculo}</b> tiene una deuda pendiente de <b>${parseFloat(vehiculoSeleccionado.saldo_pendiente).toLocaleString('es-CO')}</b>.<br/> Debe recaudar la deuda antes de poder editar los datos del vehículo.</p>
            <button
              onClick={() => setShowRecaudoModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      {showDeleteConfirm && vehiculoEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-700">⚠️ Confirmar Eliminación</h2>
            <p className="mb-6 text-gray-700">
              ¿Está seguro que desea eliminar el vehículo <b>{vehiculoEliminar.codigo_vehiculo}</b>?
              <br/>
              <span className="text-red-600 text-sm mt-2 block">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmarEliminacion}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
              >
                Sí, Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setVehiculoEliminar(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
