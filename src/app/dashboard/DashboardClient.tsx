"use client";
import { useEffect, useMemo, useState } from "react";
import SeleccionarOperadorModal from "../components/SeleccionarOperadorModal";
import ValidarPinModal from "../components/ValidarPinModal";
import { useOperadorSeleccionado } from "../hooks/useOperadorSeleccionado";
import LogoutButton from "./LogoutButton";

export default function DashboardClient({ user, rol, modulos, metricas }: { user: any, rol: string, modulos: any[], metricas: any }) {
  const [operador, setOperador] = useOperadorSeleccionado(user.email);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinValidado, setPinValidado] = useState(false);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const requierePin = rol !== 'administrador';

  const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
    green: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', ring: 'ring-pink-200' },
    red: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', ring: 'ring-teal-200' },
  };

  const favoritosStorageKey = `dashboard:favoritos:${user.email}`;

  const modulosOrdenados = useMemo(() => {
    if (!Array.isArray(modulos) || modulos.length === 0) return [];

    const setFavoritos = new Set(favoritos);
    const favoritosPrimero = modulos.filter((m) => setFavoritos.has(m.ruta));
    const restantes = modulos.filter((m) => !setFavoritos.has(m.ruta));
    return [...favoritosPrimero, ...restantes];
  }, [modulos, favoritos]);

  const topModulos = modulosOrdenados.slice(0, 4);
  const otrosModulos = modulosOrdenados.slice(4);

  function toggleFavorito(ruta: string) {
    setFavoritos((prev) =>
      prev.includes(ruta) ? prev.filter((item) => item !== ruta) : [...prev, ruta]
    );
  }

  useEffect(() => {
    if (!requierePin) {
      setPinValidado(true);
    }

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
  }, [user.email, operador, setOperador, requierePin]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(favoritosStorageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const rutasDisponibles = new Set((modulos || []).map((m) => m.ruta));
      const rutasValidas = parsed.filter((ruta: unknown) => typeof ruta === 'string' && rutasDisponibles.has(ruta));
      setFavoritos(rutasValidas);
    } catch (error) {
      console.error('Error leyendo favoritos del dashboard:', error);
    }
  }, [favoritosStorageKey, modulos]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(favoritosStorageKey, JSON.stringify(favoritos));
  }, [favoritos, favoritosStorageKey]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (requierePin && !pinValidado) {
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

  const participacionPlanillas = Array.isArray(metricas.participacionPlanillas)
    ? metricas.participacionPlanillas
    : [];

  function nombreCortoOperador(operador: string) {
    if (!operador) return 'Sin operador';
    const limpio = operador.trim();
    if (limpio.includes('@')) {
      return limpio.split('@')[0];
    }
    return limpio;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Panel principal</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {saludo()}, {operador ? operador.nombre : user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {bogotaNow.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div>
              <div className="mb-3 flex justify-end">
                <LogoutButton />
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Planillas por operador (mes actual)</p>

              {participacionPlanillas.length === 0 ? (
                <div className="mt-3 rounded-xl bg-white/10 px-3 py-3 text-xs text-white/80">
                  Aún no hay planillas registradas este mes.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {participacionPlanillas.map((item: any) => (
                    <div key={item.operador}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white/90">{nombreCortoOperador(item.operador)}</span>
                        <span className="text-white/80">{item.porcentaje}% · {item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/20">
                        <div className="h-2 rounded-full bg-emerald-300 transition-all" style={{ width: `${Math.min(100, Number(item.porcentaje) || 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </section>

        {/* Métricas principales */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">Resumen General</h3>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Actualizado hoy
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dinero sin liquidar */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
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
        </section>

        {/* Métricas secundarias */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Indicadores operativos</h4>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Planillas hoy */}
            <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Planillas Creadas Hoy</h4>
                  <p className="text-2xl font-bold text-slate-900">{metricas.numPlanillasHoy}</p>
                </div>
                <span className="text-3xl">📝</span>
              </div>
            </div>

            {/* Total vehículos */}
            <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
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

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Actividad</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500">Usuario</p>
                <p className="mt-1 font-semibold text-slate-900">{operador ? operador.nombre : user.email}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500">Rol activo</p>
                <p className="mt-1 font-semibold capitalize text-slate-900">{rol}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500">Módulos habilitados</p>
                <p className="mt-1 font-semibold text-slate-900">{modulos.length}</p>
              </div>
            </div>
          </aside>
        </section>

        {/* Módulos disponibles */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">Accesos rápidos</h3>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">favoritos primero</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {topModulos.map((modulo) => {
              const style = colorClasses[modulo.color] || colorClasses.slate;
              const esFavorito = favoritos.includes(modulo.ruta);
              return (
                <a
                  key={modulo.nombre}
                  href={modulo.ruta}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${style.bg} ${style.text} ring-1 ${style.ring}`}>
                      <span className="text-xl">{modulo.icono}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorito(modulo.ruta);
                      }}
                      className={`rounded-full px-2 py-1 text-xs font-semibold transition ${esFavorito ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {esFavorito ? '★' : '☆'}
                    </button>
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-900">{modulo.nombre}</h4>
                  <p className="mt-1 text-sm text-slate-500">Módulo principal del turno.</p>
                </a>
              );
            })}
          </div>

          {otrosModulos.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Más módulos</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otrosModulos.map((modulo) => {
                  const style = colorClasses[modulo.color] || colorClasses.slate;
                  const esFavorito = favoritos.includes(modulo.ruta);
                  return (
                    <a
                      key={modulo.nombre}
                      href={modulo.ruta}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${style.bg} ${style.text} ring-1 ${style.ring}`}>
                          {modulo.icono}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{modulo.nombre}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorito(modulo.ruta);
                        }}
                        className={`rounded-full px-2 py-1 text-xs font-semibold transition ${esFavorito ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                        title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        {esFavorito ? '★' : '☆'}
                      </button>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {modulos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
              No tienes módulos asignados.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
