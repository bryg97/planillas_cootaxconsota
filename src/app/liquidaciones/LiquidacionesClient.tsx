'use client';

import { useEffect, useState } from "react";
import { crearLiquidacion, aprobarLiquidacion } from "./actions";
import * as XLSX from 'xlsx';

// Función para formatear fecha en formato Colombia (dd/mm/yyyy)
function formatFechaColombia(fecha: any): string {
  if (!fecha) return '';
  const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString?.() || String(fecha);
  const match = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return fechaStr;
}

// Función para obtener fecha ISO (YYYY-MM-DD) de cualquier formato
function getFechaISO(fecha: any): string {
  if (!fecha) return '';
  const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString?.() || String(fecha);
  const match = fechaStr.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export default function LiquidacionesClient({ 
  rol,
  planillas,
  liquidacionesPendientes
}: { 
  rol: string;
  planillas: any[];
  liquidacionesPendientes: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<any[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");
  const [planillaDetalle, setPlanillaDetalle] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [autoPrintPending, setAutoPrintPending] = useState(false);

  // Debug logs
  console.log('LiquidacionesClient - Rol:', rol);
  console.log('LiquidacionesClient - Planillas recibidas:', planillas?.length || 0);
  console.log('LiquidacionesClient - Liquidaciones pendientes:', liquidacionesPendientes?.length || 0);

  useEffect(() => {
    const shouldAutoPrint = sessionStorage.getItem('liquidaciones:autoPrint');
    if (shouldAutoPrint === '1') {
      sessionStorage.removeItem('liquidaciones:autoPrint');
      setAutoPrintPending(true);
    }
  }, []);

  useEffect(() => {
    if (!autoPrintPending) return;

    const timer = window.setTimeout(() => {
      handleImprimir();
      setAutoPrintPending(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [autoPrintPending]);



    function seleccionarTodas() {
      const idsVisibles = planillasFiltradas.map((p) => p.id);
      setPlanillasSeleccionadas(idsVisibles);
    }

    function deseleccionarTodas() {
      setPlanillasSeleccionadas([]);
    }

    const planillasFiltradas = planillas.filter((p) => {
      const textoBusqueda = busqueda.toLowerCase();
      const cumpleBusqueda = !busqueda || (
        p.numero_planilla?.toLowerCase().includes(textoBusqueda) ||
        p.conductor?.toLowerCase().includes(textoBusqueda) ||
        p.codigo_vehiculo?.toLowerCase().includes(textoBusqueda)
      );
      
      if (!cumpleBusqueda) return false;
      
      if (!fechaDesde && !fechaHasta) return true;
      
      // Usar getFechaISO para obtener formato YYYY-MM-DD consistente
      const fechaPlanilla = getFechaISO(p.fecha);
      
      if (fechaDesde && fechaHasta) {
        return fechaPlanilla >= fechaDesde && fechaPlanilla <= fechaHasta;
      } else if (fechaDesde) {
        return fechaPlanilla >= fechaDesde;
      } else if (fechaHasta) {
        return fechaPlanilla <= fechaHasta;
      }
      return true;
    });

    async function handleCrearLiquidacion() {
      if (planillasSeleccionadas.length === 0) {
        setError("Seleccione al menos una planilla");
        setMessage("");
        return;
      }
      if (!confirm("¿Crear liquidación con las planillas seleccionadas?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const result = await crearLiquidacion(planillasSeleccionadas);
        if (result.error) {
          setError(result.error);
          setMessage("");
        } else {
          setError("");
          setMessage("Liquidación creada y aprobada correctamente.");
          setPlanillasSeleccionadas([]);
          sessionStorage.setItem('liquidaciones:autoPrint', '1');
          setTimeout(() => window.location.reload(), 1200);
        }
      } catch (e) {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
        setMessage("");
      }
      setLoading(false);
    }

    function handleImprimir() {
      const ventana = window.open('', '', 'height=700,width=1000');
      if (!ventana) return;

      const planillasVisibles = planillasFiltradas;
      const planillasSeleccionadasData = planillasFiltradas.filter((p) => planillasSeleccionadas.includes(p.id));
      const planillasImprimir = planillasSeleccionadasData.length > 0 ? planillasSeleccionadasData : planillasVisibles;
      const totalVisibles = planillasVisibles.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);
      const totalSeleccionadas = planillasSeleccionadasData.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);
      const totalImprimir = planillasImprimir.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);

      const renderTablaPlanillas = (rows: any[]) => {
        if (rows.length === 0) {
          return '<p class="empty">No hay registros para mostrar.</p>';
        }

        return `
          <table>
            <thead>
              <tr>
                <th>N° Planilla</th>
                <th>Fecha</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th class="right">Valor</th>
                <th>Tipo Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((p) => `
                <tr>
                  <td>${p.numero_planilla || ''}</td>
                  <td>${formatFechaColombia(p.fecha)}</td>
                  <td>${p.codigo_vehiculo || ''}</td>
                  <td>${p.conductor || ''}</td>
                  <td class="right">$${(parseFloat(String(p.valor)) || 0).toLocaleString('es-CO')}</td>
                  <td>${p.tipo_pago || ''}</td>
                  <td>${p.estado || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      };

      const renderLiquidaciones = () => {
        if (!liquidacionesPendientes || liquidacionesPendientes.length === 0) {
          return '<p class="empty">No hay liquidaciones registradas.</p>';
        }

        return liquidacionesPendientes.map((liquidacion) => {
          const totalCalculado = (liquidacion.detalles || []).reduce((sum: number, d: any) => sum + (parseFloat(String(d.monto)) || 0), 0);

          return `
            <div class="card page-break">
              <div class="row">
                <div>
                  <h3>Liquidación #${liquidacion.id}</h3>
                  <div class="muted">Operador: ${liquidacion.operador_nombre || liquidacion.usuario || 'Desconocido'}</div>
                  <div class="muted">Fecha: ${formatFechaColombia(liquidacion.fecha)}</div>
                  <div class="muted">Estado: ${liquidacion.estado || ''}</div>
                </div>
                <div class="total">$${totalCalculado.toLocaleString('es-CO')}</div>
              </div>
              <h4>Planillas incluidas</h4>
              <table>
                <thead>
                  <tr>
                    <th>N° Planilla</th>
                    <th>Vehículo</th>
                    <th class="right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${(liquidacion.detalles || []).map((detalle: any) => `
                    <tr>
                      <td>${detalle.numero_planilla || ''}</td>
                      <td>${detalle.codigo_vehiculo || ''}</td>
                      <td class="right">$${(parseFloat(String(detalle.monto)) || 0).toLocaleString('es-CO')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('');
      };

      ventana.document.write(`
        <html>
          <head>
            <title>Reporte de Liquidaciones</title>
            <style>
              @page { size: A4 landscape; margin: 12mm; }
              * { box-sizing: border-box; }
              body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111827; font-size: 12px; }
              .report { padding: 0; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
              .title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
              .subtitle { color: #6b7280; margin: 0; }
              .meta { text-align: right; font-size: 11px; color: #374151; }
              .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
              .box { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; background: #f9fafb; }
              .label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; margin-bottom: 4px; }
              .value { font-size: 18px; font-weight: 700; color: #111827; }
              .section { margin-bottom: 16px; }
              .section-title { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
              .card { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
              .page-break { page-break-inside: avoid; }
              .row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 10px; }
              .muted { color: #6b7280; font-size: 11px; margin-top: 2px; }
              .total { font-size: 22px; font-weight: 700; color: #047857; white-space: nowrap; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-size: 11px; }
              th { background: #f3f4f6; }
              .right { text-align: right; }
              .empty { color: #6b7280; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="report">
              <div class="header">
                <div>
                  <h1 class="title">Reporte de Liquidaciones</h1>
                  <p class="subtitle">Sistema de Planillas Cootaxconsota</p>
                </div>
                <div class="meta">
                  <div>Generado: ${new Date().toLocaleString('es-CO')}</div>
                  <div>Rol: ${rol}</div>
                </div>
              </div>

              <div class="summary">
                <div class="box">
                  <div class="label">Planillas visibles</div>
                  <div class="value">${planillasVisibles.length}</div>
                </div>
                <div class="box">
                  <div class="label">Seleccionadas</div>
                  <div class="value">${planillasSeleccionadasData.length}</div>
                </div>
                <div class="box">
                  <div class="label">Total a imprimir</div>
                  <div class="value">$${totalImprimir.toLocaleString('es-CO')}</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">${planillasSeleccionadasData.length > 0 ? 'Planillas seleccionadas' : 'Planillas visibles'}</div>
                ${renderTablaPlanillas(planillasImprimir)}
              </div>

              <div class="section">
                <div class="section-title">Liquidaciones registradas</div>
                ${renderLiquidaciones()}
              </div>

              
            </div>
          </body>
        </html>
      `);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => {
        ventana.print();
        ventana.close();
      }, 300);
    }

    async function handleAprobarLiquidacion(liquidacionId: number) {
      if (!confirm("¿Confirmar recepción de dinero?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      const result = await aprobarLiquidacion(liquidacionId);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Liquidación aprobada y notificación enviada");
        setTimeout(() => window.location.reload(), 2000);
      }
      setLoading(false);
    }

    function exportarPlanillas() {
      const datosExportar = planillasFiltradas.map(p => ({
        'N° Planilla': p.numero_planilla,
        'Fecha': formatFechaColombia(p.fecha),
        'Vehículo': p.codigo_vehiculo || '',
        'Conductor': p.conductor,
        'Tipo': p.tipo_pago,
        'Valor': p.valor,
        'Estado': p.estado,
        'Seleccionada': planillasSeleccionadas.includes(p.id) ? 'Sí' : 'No'
      }));

      const ws = XLSX.utils.json_to_sheet(datosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planillas");

      // Aplicar ancho a columnas
      ws['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
      ];

      XLSX.writeFile(wb, `Planillas_Liquidacion_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // --- Aquí va el JSX ---
    const totalPlanillasFiltradas = planillasFiltradas.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);
    const totalSeleccionadas = planillasFiltradas
      .filter((p) => planillasSeleccionadas.includes(p.id))
      .reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);

    return (
      <main className="min-h-screen bg-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
            <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                  Liquidaciones
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Liquidaciones
                </h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="/dashboard" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  ← Volver al Dashboard
                </a>
                <button onClick={handleImprimir} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Imprimir reporte
                </button>
                <button onClick={exportarPlanillas} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">
                  Exportar Excel
                </button>
              </div>
            </div>
          </section>

          {(error || message) && (
            <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error || message}
            </div>
          )}

          <div id="liquidaciones-print-area" className="space-y-6">
            <div id="liquidaciones-print-content" className="space-y-6">
              {(rol === 'operador' || rol === 'administrador') && (
                <section className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Planillas para liquidar</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                          {rol === 'administrador' ? 'Todas las planillas' : 'Mis planillas'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                          Seleccione las planillas de contado o crédito ya recaudado.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center sm:min-w-72">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">Visibles</div>
                          <div className="mt-1 text-2xl font-bold text-slate-900">{planillasFiltradas.length}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">Seleccionadas</div>
                          <div className="mt-1 text-2xl font-bold text-slate-900">{planillasSeleccionadas.length}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Buscar planilla, conductor o vehículo</label>
                        <input
                          type="text"
                          placeholder="Buscar por número, conductor o vehículo..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rango de fechas</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                          <div className="md:col-span-1">
                            <label className="mb-1 block text-sm font-medium text-slate-700">Desde</label>
                            <input
                              type="date"
                              value={fechaDesde}
                              onChange={(e) => setFechaDesde(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="mb-1 block text-sm font-medium text-slate-700">Hasta</label>
                            <input
                              type="date"
                              value={fechaHasta}
                              onChange={(e) => setFechaHasta(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div className="flex items-end">
                            <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="w-full rounded-xl bg-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300">
                              Limpiar
                            </button>
                          </div>
                          <div className="flex items-end">
                            <button onClick={seleccionarTodas} className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500">
                              Seleccionar todo
                            </button>
                          </div>
                          <div className="flex items-end">
                            <button onClick={deseleccionarTodas} className="w-full rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50">
                              Deseleccionar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      {planillasFiltradas.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                          <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium text-slate-700">No hay planillas para liquidar en este rango</p>
                          <p className="mt-1 text-sm text-slate-500">Ajuste los filtros o limpie la búsqueda.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm text-slate-500">Mostrando {planillasFiltradas.length} planilla(s).</div>
                          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                            {planillasFiltradas.map((planilla) => {
                              const selected = planillasSeleccionadas.includes(planilla.id);

                              return (
                                <label key={planilla.id} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${selected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => {
                                      if (selected) {
                                        setPlanillasSeleccionadas(planillasSeleccionadas.filter(id => id !== planilla.id));
                                      } else {
                                        setPlanillasSeleccionadas([...planillasSeleccionadas, planilla.id]);
                                      }
                                    }}
                                    className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-slate-900">N° {planilla.numero_planilla}</p>
                                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${planilla.tipo_pago === 'credito' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {planilla.tipo_pago === 'credito' ? 'Crédito recaudado' : 'Contado'}
                                      </span>
                                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                                        {planilla.estado}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">
                                      <span className="font-medium text-slate-900">{planilla.codigo_vehiculo || ''}</span> • {planilla.conductor || ''} • {formatFechaColombia(planilla.fecha)}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <p className="text-lg font-bold text-slate-900">${(parseFloat(String(planilla.valor)) || 0).toLocaleString('es-CO')}</p>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setPlanillaDetalle(planilla);
                                      }}
                                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                                    >
                                      Ver detalles
                                    </button>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Resumen rápido</p>
                      <div className="mt-5 space-y-4">
                        <div>
                          <div className="text-sm text-slate-400">Total visible</div>
                          <div className="text-3xl font-bold">${totalPlanillasFiltradas.toLocaleString('es-CO')}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-white/10 px-4 py-3">
                            <div className="text-xs uppercase tracking-wide text-slate-400">Seleccionadas</div>
                            <div className="mt-1 text-2xl font-bold">{planillasSeleccionadas.length}</div>
                          </div>
                          <div className="rounded-2xl bg-white/10 px-4 py-3">
                            <div className="text-xs uppercase tracking-wide text-slate-400">A liquidar</div>
                            <div className="mt-1 text-2xl font-bold">${totalSeleccionadas.toLocaleString('es-CO')}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                          Revise que las planillas estén recaudadas antes de crear la liquidación.
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">Acción principal</h3>
                      <p className="mt-2 text-sm text-slate-600">Cree la liquidación con las planillas seleccionadas.</p>
                      <button onClick={handleCrearLiquidacion} disabled={loading || planillasSeleccionadas.length === 0} className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                        {loading ? 'Procesando...' : 'Crear liquidación'}
                      </button>
                    </div>
                  </aside>
                </section>
              )}

              {(rol === 'operador' || rol === 'tesorera' || rol === 'administrador') && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Liquidaciones</p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">Pendientes de aprobación</h2>
                    </div>
                    <p className="text-sm text-slate-500">{liquidacionesPendientes.length} registro(s)</p>
                  </div>

                  {liquidacionesPendientes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                      No hay liquidaciones pendientes.
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {liquidacionesPendientes.map((liquidacion) => {
                        const totalCalculado = (liquidacion.detalles || []).reduce((sum: number, d: any) => sum + (parseFloat(String(d.monto)) || 0), 0);

                        return (
                          <div key={liquidacion.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operador</div>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">{liquidacion.operador_nombre || liquidacion.usuario}</h3>
                                <p className="mt-1 text-sm text-slate-500">Fecha: {formatFechaColombia(liquidacion.fecha)}</p>
                              </div>
                              <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-right">
                                <div className="text-xs uppercase tracking-wide text-emerald-700">Total</div>
                                <div className="text-xl font-bold text-emerald-800">${totalCalculado.toLocaleString('es-CO')}</div>
                              </div>
                            </div>

                            <div className="mt-4 rounded-2xl bg-white p-4">
                              <p className="mb-3 text-sm font-semibold text-slate-700">Planillas incluidas</p>
                              <div className="space-y-2">
                                {(liquidacion.detalles || []).map((detalle: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                    <span className="text-slate-700">N° {detalle.numero_planilla} - {detalle.codigo_vehiculo}</span>
                                    <span className="font-semibold text-slate-900">${(parseFloat(String(detalle.monto)) || 0).toLocaleString('es-CO')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button onClick={() => handleAprobarLiquidacion(liquidacion.id)} disabled={loading} className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
                              {loading ? 'Procesando...' : 'Confirmar recepción'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resumen</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Liquidaciones registradas</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {liquidacionesPendientes.length} total
                  </span>
                </div>

                {liquidacionesPendientes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                    No hay liquidaciones para mostrar.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {liquidacionesPendientes.map((liquidacion) => {
                      const totalCalculado = (liquidacion.detalles || []).reduce((sum: number, d: any) => sum + (parseFloat(String(d.monto)) || 0), 0);

                      return (
                        <div key={liquidacion.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operador</div>
                              <h3 className="mt-1 text-lg font-semibold text-slate-900">{liquidacion.operador_nombre || liquidacion.usuario}</h3>
                              <p className="mt-1 text-sm text-slate-500">Fecha: {formatFechaColombia(liquidacion.fecha)}</p>
                              <p className="mt-1 text-sm text-slate-500">Estado: {liquidacion.estado}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
                              <div className="text-2xl font-bold text-slate-900">${totalCalculado.toLocaleString('es-CO')}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Modal de detalles de planilla */}
          {planillaDetalle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Detalles</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Planilla #{planillaDetalle.numero_planilla}</h2>
                  </div>
                  <button onClick={() => setPlanillaDetalle(null)} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vehículo</label>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{planillaDetalle.codigo_vehiculo}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conductor</label>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{planillaDetalle.conductor}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Valor</label>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">${parseFloat(planillaDetalle.valor).toLocaleString('es-CO')}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</label>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{planillaDetalle.estado === 'recaudada' ? '✓ Recaudada' : planillaDetalle.estado}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Trazabilidad</h3>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <div>Fecha de creación: {planillaDetalle.created_at ? new Date(planillaDetalle.created_at).toLocaleString('es-CO') : 'N/A'}</div>
                    <div>Creado por: {planillaDetalle.usuario || planillaDetalle.operador || 'Desconocido'}</div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={() => setPlanillaDetalle(null)} className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
}
