"use client";
import { useEffect, useState } from "react";
import SeleccionarOperadorModal from "../components/SeleccionarOperadorModal";
import { useOperadorSeleccionado } from "../hooks/useOperadorSeleccionado";
import LogoutButton from "./LogoutButton";

export default function DashboardClient({ user, rol, modulos, metricas }: { user: any, rol: string, modulos: any[], metricas: any }) {
  const [operador, setOperador] = useOperadorSeleccionado(user.email);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOperadores() {
      // Buscar operadores vinculados a este correo
      const res = await fetch(`/api/operadores?correo=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setOperadores(data);
      setLoading(false);
    }
    if (!operador) fetchOperadores();
    else setLoading(false);
  }, [user.email, operador]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (!operador && operadores.length > 0) {
    return (
      <SeleccionarOperadorModal
        operadores={operadores}
        onSelect={(op) => {
          localStorage.setItem("operadorSeleccionado", JSON.stringify(op));
          setOperador(op);
        }}
      />
    );
  }

  // Usar hora local de Bogotá para saludo y fecha
  const bogotaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const saludo = () => {
    const hora = bogotaNow.getHours();
    if (hora >= 6 && hora < 12) return 'Buenos días';
    if (hora >= 12 && hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚖</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cootaxconsota
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sistema de Planillas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {operador ? operador.nombre : user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {rol}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {saludo()}, {operador ? operador.nombre : user.user_metadata?.full_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Panel de control - {bogotaNow.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Métricas principales */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Resumen General</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dinero sin liquidar */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Dinero Sin Liquidar</h4>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                ${metricas.dineroSinLiquidar.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-200 mt-2">
                Pendiente de liquidación
              </p>
            </div>

            {/* Estado de cartera */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">Estado de Cartera</h4>
                <span className="text-2xl">💼</span>
              </div>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                ${metricas.totalCartera.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-200 mt-2">
                Créditos por recaudar
              </p>
            </div>

            {/* Liquidaciones pendientes */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">Liquidaciones Pendientes</h4>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {metricas.numLiquidacionesPendientes}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-200 mt-2">
                ${metricas.montoLiquidacionesPendientes.toLocaleString('es-CO')} por aprobar
              </p>
            </div>

            {/* Recaudado este mes */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100">Recaudado Este Mes</h4>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                ${metricas.totalRecaudadoMes.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-green-700 dark:text-green-200 mt-2">
                Total del mes actual
              </p>
            </div>
          </div>
        </div>

        {/* Métricas secundarias */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Planillas hoy */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Planillas Creadas Hoy</h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.numPlanillasHoy}</p>
                </div>
                <span className="text-4xl">📝</span>
              </div>
            </div>

            {/* Total vehículos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Vehículos</h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.totalVehiculos}</p>
                </div>
                <span className="text-4xl">🚖</span>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos disponibles */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Accesos Rápidos</h3>
        </div>
        {/* Renderizar los módulos disponibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {modulos && modulos.length > 0 ? (
            modulos.map((modulo) => (
              <a
                key={modulo.nombre}
                href={modulo.ruta}
                className={`block p-6 rounded-lg shadow-md bg-white hover:shadow-xl border-t-4 border-${modulo.color}-600 transition-all transform hover:-translate-y-1`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{modulo.icono}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{modulo.nombre}</h3>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">No tienes módulos asignados.</div>
          )}
        </div>
      </main>
    </div>
  );
}
