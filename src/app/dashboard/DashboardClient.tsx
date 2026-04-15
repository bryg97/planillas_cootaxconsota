"use client";
import { useEffect, useState } from "react";
import SeleccionarOperadorModal from "../components/SeleccionarOperadorModal";
import ValidarPinModal from "../components/ValidarPinModal";
import { useOperadorSeleccionado } from "../hooks/useOperadorSeleccionado";
import LogoutButton from "./LogoutButton";

export default function DashboardClient({ user, rol, modulos, metricas }: { user: any, rol: string, modulos: any[], metricas: any }) {
  const [operador, setOperador] = useOperadorSeleccionado(user.email);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinValidado, setPinValidado] = useState(false);

  useEffect(() => {
    const pinSesion = sessionStorage.getItem(`pinValidado:${user.email}`);
    if (pinSesion) {
      setPinValidado(true);
    }

    async function fetchOperadores() {
      // Buscar operadores vinculados a este correo
      const res = await fetch(`/api/operadores?correo=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setOperadores(data);

      if (!operador && Array.isArray(data) && data.length === 1) {
        localStorage.setItem("operadorSeleccionado", JSON.stringify(data[0]));
        setOperador(data[0]);
      }

      setLoading(false);
    }
    if (!operador) fetchOperadores();
    else setLoading(false);
  }, [user.email, operador, setOperador]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (!pinValidado) {
    return (
      <ValidarPinModal
        email={user.email}
        onValidated={() => {
          sessionStorage.setItem(`pinValidado:${user.email}`, '1');
          setPinValidado(true);
        }}
      />
    );
  }

  if (!operador && operadores.length > 1) {
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
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚖</div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                  Cootaxconsota
                </h1>
                <p className="text-xs text-slate-500">
                  Sistema de Planillas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  {operador ? operador.nombre : user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-slate-500 capitalize">
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
          <h2 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            {saludo()}, {operador ? operador.nombre : user.user_metadata?.full_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-slate-600">
            Panel de control - {bogotaNow.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Métricas principales */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Resumen General</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dinero sin liquidar */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-600">Dinero Sin Liquidar</h4>
                <span className="text-lg">💰</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                ${metricas.dineroSinLiquidar.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Pendiente de liquidación
              </p>
            </div>

            {/* Estado de cartera */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-600">Estado de Cartera</h4>
                <span className="text-lg">💼</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                ${metricas.totalCartera.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Créditos por recaudar
              </p>
            </div>

            {/* Liquidaciones pendientes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-600">Liquidaciones Pendientes</h4>
                <span className="text-lg">📋</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {metricas.numLiquidacionesPendientes}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                ${metricas.montoLiquidacionesPendientes.toLocaleString('es-CO')} por aprobar
              </p>
            </div>

            {/* Recaudado este mes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-600">Recaudado Este Mes</h4>
                <span className="text-lg">📊</span>
              </div>
              <p className="text-3xl font-bold text-emerald-700">
                ${metricas.totalRecaudadoMes.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Total del mes actual
              </p>
            </div>
          </div>
        </div>

        {/* Métricas secundarias */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Planillas hoy */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Planillas Creadas Hoy</h4>
                  <p className="text-2xl font-bold text-slate-900">{metricas.numPlanillasHoy}</p>
                </div>
                <span className="text-3xl">📝</span>
              </div>
            </div>

            {/* Total vehículos */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Total Vehículos</h4>
                  <p className="text-2xl font-bold text-slate-900">{metricas.totalVehiculos}</p>
                </div>
                <span className="text-3xl">🚖</span>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos disponibles */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Accesos Rápidos</h3>
        </div>
        {/* Renderizar los módulos disponibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {modulos && modulos.length > 0 ? (
            modulos.map((modulo) => (
              <a
                key={modulo.nombre}
                href={modulo.ruta}
                className="block p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{modulo.icono}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{modulo.nombre}</h3>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full text-center text-slate-500">No tienes módulos asignados.</div>
          )}
        </div>
      </main>
    </div>
  );
}
