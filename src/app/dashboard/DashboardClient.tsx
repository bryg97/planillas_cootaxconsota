"use client";
import { useEffect, useState } from "react";
import SeleccionarOperadorModal from "../components/SeleccionarOperadorModal";
import { useOperadorSeleccionado } from "../hooks/useOperadorSeleccionado";
import LogoutButton from "./LogoutButton";

export default function DashboardClient({ user, rol, modulos }: { user: any, rol: string, modulos: any[] }) {
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
        {/* Renderizar los módulos disponibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {modulos && modulos.length > 0 ? (
            modulos.map((modulo) => (
              <a
                key={modulo.nombre}
                href={modulo.ruta}
                className={`block p-6 rounded-lg shadow bg-white hover:bg-blue-50 border-t-4 border-${modulo.color}-600 transition-all`}
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
