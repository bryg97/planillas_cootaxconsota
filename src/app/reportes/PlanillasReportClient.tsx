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

export default function PlanillasReportClient({ planillas }: { planillas: any[] }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoPagoFiltro, setTipoPagoFiltro] = useState("");
  // Obtener email del usuario autenticado desde NextAuth
  const { data: session } = useSession();
  const email = session?.user?.email || '';
  const [operadorSeleccionado] = useOperadorSeleccionado(email);

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
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 print:bg-white">
      {/* Mostrar operador seleccionado en el encabezado */}
      {operadorSeleccionado && (
        <div className="mb-2 text-sm text-gray-700"><b>Operador:</b> {operadorSeleccionado.nombre}</div>
      )}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2 md:justify-end w-full">
          <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 print:hidden">Imprimir</button>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Desde:</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border px-3 py-2 rounded w-full md:w-48" />
            <label className="text-sm font-medium">Hasta:</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border px-3 py-2 rounded w-full md:w-48" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Tipo de Pago:</label>
            <select 
              value={tipoPagoFiltro} 
              onChange={e => setTipoPagoFiltro(e.target.value)} 
              className="border px-3 py-2 rounded w-full md:w-48"
            >
              <option value="">Todos</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto" id="planillas-table">
        <table className="min-w-full border text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">N°</th>
              <th className="px-2 py-1 border">Fecha</th>
              <th className="px-2 py-1 border">Vehículo</th>
              <th className="px-2 py-1 border">Conductor</th>
              <th className="px-2 py-1 border">Valor</th>
              <th className="px-2 py-1 border">Tipo Pago</th>
              <th className="px-2 py-1 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {planillasFiltradas.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50">
                <td className="px-2 py-1 border">{p.numero_planilla}</td>
                <td className="px-2 py-1 border">{formatFechaColombia(p.fecha)}</td>
                <td className="px-2 py-1 border">{p.codigo_vehiculo || ''}</td>
                <td className="px-2 py-1 border">{p.conductor}</td>
                <td className="px-2 py-1 border">${(parseFloat(String(p.valor)) || 0).toLocaleString("es-CO")}</td>
                <td className="px-2 py-1 border capitalize">{p.tipo_pago}</td>
                <td className="px-2 py-1 border capitalize">{p.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {planillasFiltradas.length === 0 && <div className="text-center text-gray-500 py-8">No hay planillas para mostrar en el rango seleccionado.</div>}
    </div>
  );
}
