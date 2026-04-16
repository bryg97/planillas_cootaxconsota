"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useOperadorSeleccionado } from "../hooks/useOperadorSeleccionado";
import * as XLSX from "xlsx";

// Helper para formatear fecha a dd/mm/yyyy sin usar new Date() (evita problemas de timezone)
function formatFechaColombia(fecha: string | Date | null | undefined): string {
  if (!fecha) return '';
  // Si es un Date object, convertirlo a ISO string
  const fechaStr = fecha instanceof Date ? fecha.toISOString() : String(fecha);
  // Extraer solo la parte YYYY-MM-DD (primeros 10 caracteres)
  const match = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  // Si no tiene formato ISO, intentar devolver como está
  return fechaStr.substring(0, 10);
}

function obtenerDiaSemana(fecha: string | Date | null | undefined): string {
  if (!fecha) return "";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "";
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  return dias[date.getDay()] || "";
}

function obtenerHoraMinutos(fecha: string | Date | null | undefined): string {
  if (!fecha) return "";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "";
  const horas = String(date.getHours()).padStart(2, "0");
  const minutos = String(date.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

export default function PlanillasReportClient({ planillas }: { planillas: any[] }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoPagoFiltro, setTipoPagoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [vehiculoFiltro, setVehiculoFiltro] = useState("");
  const [conductorFiltro, setConductorFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [valorMinimo, setValorMinimo] = useState("");
  const [valorMaximo, setValorMaximo] = useState("");
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState("");
  const [horaInicioFiltro, setHoraInicioFiltro] = useState("");
  const [horaFinFiltro, setHoraFinFiltro] = useState("");
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  
  // Obtener email del usuario autenticado desde NextAuth
  const { data: session } = useSession();
  const email = session?.user?.email || '';
  const [operadorSeleccionado] = useOperadorSeleccionado(email);

  // Extraer valores únicos para los selects
  const vehiculosUnicos = Array.from(new Set(planillas.map(p => p.codigo_vehiculo).filter(Boolean))).sort();
  const conductoresUnicos = Array.from(new Set(planillas.map(p => p.conductor).filter(Boolean))).sort();
  const estadosUnicos = Array.from(new Set(planillas.map(p => p.estado).filter(Boolean))).sort();
  function handleExportExcel() {
    // Agregar operador seleccionado como encabezado en la hoja
    const dataWithHeader = [
      operadorSeleccionado ? { "Operador": operadorSeleccionado.nombre } : {},
      {}, // línea vacía
      ...planillasFiltradas
    ];
    const ws = XLSX.utils.json_to_sheet(dataWithHeader, { skipHeader: false });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planillas");
    XLSX.writeFile(wb, "reporte_planillas.xlsx");
  }

  function handlePrint() {
    const printContents = document.getElementById('planillas-table')?.outerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=600,width=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Planillas</title>
          <style>
            body { font-family: sans-serif; margin: 40px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>
          <h2>Reporte de Planillas</h2>
          ${operadorSeleccionado ? `<div style='margin-bottom:10px'><b>Operador:</b> ${operadorSeleccionado.nombre}</div>` : ''}
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }

  const planillasFiltradas = planillas.filter(p => {
    // Filtro de búsqueda por número
    if (busqueda) {
      const textoBusqueda = busqueda.toLowerCase();
      if (!String(p.numero_planilla).toLowerCase().includes(textoBusqueda)) return false;
    }

    // Filtro de fecha
    if (fechaInicio || fechaFin) {
      const fecha = new Date(p.fecha);
      const desde = fechaInicio ? new Date(fechaInicio) : null;
      const hasta = fechaFin ? new Date(fechaFin) : null;
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
    }

    // Filtro de tipo de pago
    if (tipoPagoFiltro && p.tipo_pago !== tipoPagoFiltro) return false;

    // Filtro de vehículo
    if (vehiculoFiltro && p.codigo_vehiculo !== vehiculoFiltro) return false;

    // Filtro de conductor
    if (conductorFiltro && p.conductor !== conductorFiltro) return false;

    // Filtro de estado
    if (estadoFiltro && p.estado !== estadoFiltro) return false;

    // Filtro de dia de la semana
    if (diaSemanaFiltro) {
      const diaPlanilla = obtenerDiaSemana(p.created_at || p.fecha);
      if (diaPlanilla !== diaSemanaFiltro) return false;
    }

    // Filtro de rango horario
    if (horaInicioFiltro || horaFinFiltro) {
      const horaPlanilla = obtenerHoraMinutos(p.created_at || p.fecha);
      if (!horaPlanilla) return false;
      if (horaInicioFiltro && horaPlanilla < horaInicioFiltro) return false;
      if (horaFinFiltro && horaPlanilla > horaFinFiltro) return false;
    }

    // Filtro de rango de valor
    if (valorMinimo || valorMaximo) {
      const valor = parseFloat(String(p.valor)) || 0;
      if (valorMinimo && valor < parseFloat(valorMinimo)) return false;
      if (valorMaximo && valor > parseFloat(valorMaximo)) return false;
    }

    return true;
  });

  const totalFiltrado = planillasFiltradas.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);

  function limpiarTodosFiltros() {
    setBusqueda("");
    setFechaInicio("");
    setFechaFin("");
    setTipoPagoFiltro("");
    setVehiculoFiltro("");
    setConductorFiltro("");
    setEstadoFiltro("");
    setDiaSemanaFiltro("");
    setHoraInicioFiltro("");
    setHoraFinFiltro("");
    setValorMinimo("");
    setValorMaximo("");
  }

  const filtrosActivos = [
    busqueda ? { key: "busqueda", label: `Busqueda: ${busqueda}` } : null,
    fechaInicio ? { key: "fechaInicio", label: `Desde: ${fechaInicio}` } : null,
    fechaFin ? { key: "fechaFin", label: `Hasta: ${fechaFin}` } : null,
    tipoPagoFiltro ? { key: "tipoPago", label: `Tipo: ${tipoPagoFiltro}` } : null,
    vehiculoFiltro ? { key: "vehiculo", label: `Vehiculo: ${vehiculoFiltro}` } : null,
    conductorFiltro ? { key: "conductor", label: `Conductor: ${conductorFiltro}` } : null,
    estadoFiltro ? { key: "estado", label: `Estado: ${estadoFiltro}` } : null,
    diaSemanaFiltro ? { key: "diaSemana", label: `Dia: ${diaSemanaFiltro}` } : null,
    horaInicioFiltro ? { key: "horaInicio", label: `Hora desde: ${horaInicioFiltro}` } : null,
    horaFinFiltro ? { key: "horaFin", label: `Hora hasta: ${horaFinFiltro}` } : null,
    valorMinimo ? { key: "valorMin", label: `Valor min: ${valorMinimo}` } : null,
    valorMaximo ? { key: "valorMax", label: `Valor max: ${valorMaximo}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  function limpiarFiltroPorKey(key: string) {
    switch (key) {
      case "busqueda":
        setBusqueda("");
        break;
      case "fechaInicio":
        setFechaInicio("");
        break;
      case "fechaFin":
        setFechaFin("");
        break;
      case "tipoPago":
        setTipoPagoFiltro("");
        break;
      case "vehiculo":
        setVehiculoFiltro("");
        break;
      case "conductor":
        setConductorFiltro("");
        break;
      case "estado":
        setEstadoFiltro("");
        break;
      case "diaSemana":
        setDiaSemanaFiltro("");
        break;
      case "horaInicio":
        setHoraInicioFiltro("");
        break;
      case "horaFin":
        setHoraFinFiltro("");
        break;
      case "valorMin":
        setValorMinimo("");
        break;
      case "valorMax":
        setValorMaximo("");
        break;
      default:
        break;
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Análisis</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Reporte de planillas</h3>
              <p className="mt-1 text-sm text-slate-600">Consulta y analiza planillas con filtros avanzados</p>
            </div>
            <button
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              <svg className={`h-4 w-4 transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {mostrarFiltrosAvanzados ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Buscar por N° Planilla</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej: 001, 2024..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {mostrarFiltrosAvanzados && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Filtros avanzados</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Vehículo</label>
                  <select
                    value={vehiculoFiltro}
                    onChange={(e) => setVehiculoFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos los vehículos</option>
                    {vehiculosUnicos.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Conductor</label>
                  <select
                    value={conductorFiltro}
                    onChange={(e) => setConductorFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos los conductores</option>
                    {conductoresUnicos.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo de pago</label>
                  <select
                    value={tipoPagoFiltro}
                    onChange={(e) => setTipoPagoFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos</option>
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Estado</label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos los estados</option>
                    {estadosUnicos.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Dia de la semana</label>
                  <select
                    value={diaSemanaFiltro}
                    onChange={(e) => setDiaSemanaFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos los dias</option>
                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                    <option value="miercoles">Miercoles</option>
                    <option value="jueves">Jueves</option>
                    <option value="viernes">Viernes</option>
                    <option value="sabado">Sabado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Hora desde</label>
                  <input
                    type="time"
                    value={horaInicioFiltro}
                    onChange={(e) => setHoraInicioFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Hora hasta</label>
                  <input
                    type="time"
                    value={horaFinFiltro}
                    onChange={(e) => setHoraFinFiltro(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Valor mínimo</label>
                  <input
                    type="number"
                    value={valorMinimo}
                    onChange={(e) => setValorMinimo(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Valor máximo</label>
                  <input
                    type="number"
                    value={valorMaximo}
                    onChange={(e) => setValorMaximo(e.target.value)}
                    placeholder="Sin límite"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                onClick={limpiarTodosFiltros}
                className="w-full rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {filtrosActivos.length > 0 && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Filtros activos ({filtrosActivos.length})</p>
                <button
                  onClick={limpiarTodosFiltros}
                  className="text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  Limpiar todo
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filtrosActivos.map((filtro) => (
                  <button
                    key={filtro.key}
                    onClick={() => limpiarFiltroPorKey(filtro.key)}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 transition hover:bg-blue-100"
                    title="Quitar filtro"
                  >
                    <span>{filtro.label}</span>
                    <span className="text-blue-600">x</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-100 p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Registros encontrados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{planillasFiltradas.length}</p>
        </div>
        <div className="rounded-2xl bg-blue-100 p-4 border border-blue-200">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total acumulado</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">${totalFiltrado.toLocaleString('es-CO')}</p>
        </div>
        <div className="rounded-2xl bg-emerald-100 p-4 border border-emerald-200">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Promedio</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">
            ${planillasFiltradas.length > 0 ? (totalFiltrado / planillasFiltradas.length).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : '0'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 print:hidden">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-3 font-medium transition hover:bg-emerald-500"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar Excel
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-3 font-medium transition hover:bg-blue-500"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2zm-6-4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          Imprimir
        </button>
      </div>

      {planillasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-700">No hay planillas que coincidan con los filtros</p>
          <p className="mt-1 text-sm text-slate-500">Intenta ajustar los criterios de búsqueda</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 print:bg-white" id="planillas-table">
          <div className="max-h-[32rem] overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">N° Planilla</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Vehículo</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Conductor</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {planillasFiltradas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.numero_planilla}</td>
                    <td className="px-4 py-3 text-slate-700">{formatFechaColombia(p.fecha)}</td>
                    <td className="px-4 py-3 text-slate-700">{p.codigo_vehiculo || ''}</td>
                    <td className="px-4 py-3 text-slate-700">{p.conductor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">${(parseFloat(String(p.valor)) || 0).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.tipo_pago === 'credito' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.tipo_pago === 'credito' ? 'Crédito' : 'Contado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
