"use client";
import dynamic from "next/dynamic";

const LiquidacionesReportClient = dynamic(() => import("./LiquidacionesReportClient"), { ssr: false });
const PlanillasReportClient = dynamic(() => import("./PlanillasReportClient"), { ssr: false });

export default function ReportesClient({ planillas, liquidaciones, totalPlanillas, totalVehiculos, totalRecaudado }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Estadísticas Generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Planillas</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPlanillas}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Vehículos</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalVehiculos}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Recaudo Total</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">${totalRecaudado.toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-bold mb-2 text-blue-700">Reporte de Liquidaciones</h2>
            <LiquidacionesReportClient liquidaciones={liquidaciones || []} />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2 text-blue-700">Reporte de Planillas por Rango de Fechas</h2>
            <PlanillasReportClient planillas={planillas || []} />
          </div>
        </div>
      </main>
    </div>
  );
}
