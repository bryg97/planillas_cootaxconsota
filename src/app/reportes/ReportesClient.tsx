"use client";
import dynamic from "next/dynamic";

const PlanillasReportClient = dynamic(() => import("./PlanillasReportClient"), { ssr: false });

export default function ReportesClient({ planillas, totalPlanillas, totalVehiculos, totalRecaudado }: any) {
  return (
    <div className="min-h-screen bg-slate-100">
      <section className="overflow-hidden rounded-none bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
              Reportes
            </div>
            <h1 className="mt-4 text-3xl font-bold">Analisis y reportes</h1>
            <p className="mt-2 text-base text-white/90">Visualiza estadisticas generales y genera reportes personalizados de planillas</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/dashboard" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              Volver
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{totalPlanillas}</p>
                <p className="mt-1 text-sm text-slate-600">Planillas registradas</p>
              </div>
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Vehiculos</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{totalVehiculos}</p>
                <p className="mt-1 text-sm text-blue-700">Laterales unicos</p>
              </div>
              <svg className="h-8 w-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Total recaudado</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">${totalRecaudado.toLocaleString('es-CO')}</p>
                <p className="mt-1 text-sm text-emerald-700">Dinero acumulado</p>
              </div>
              <svg className="h-8 w-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </section>

        <section>
          <PlanillasReportClient planillas={planillas || []} />
        </section>
      </main>
    </div>
  );
}
