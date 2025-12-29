"use client";
import { useState } from "react";
import { useOperadorSeleccionado } from "../hooks/useOperadorSeleccionado";
import * as XLSX from "xlsx";

export default function PlanillasReportClient({ planillas }: { planillas: any[] }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  // Obtener email del usuario autenticado desde localStorage (ya que es client component)
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('supabase.auth.user') || 'null') : null;
  const email = user?.email || '';
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
    if (!fechaInicio && !fechaFin) return true;
    const fecha = new Date(p.fecha);
    const desde = fechaInicio ? new Date(fechaInicio) : null;
    const hasta = fechaFin ? new Date(fechaFin) : null;
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 print:bg-white">
      {/* Mostrar operador seleccionado en el encabezado */}
      {operadorSeleccionado && (
        <div className="mb-2 text-sm text-gray-700"><b>Operador:</b> {operadorSeleccionado.nombre}</div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 items-center w-full md:w-1/3">
          <label>Desde:</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border px-3 py-2 rounded w-full" />
          <label>Hasta:</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>
        <div className="flex gap-2 md:justify-end w-full md:w-auto">
          <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 print:hidden">Imprimir</button>
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
                <td className="px-2 py-1 border">{new Date(p.fecha).toLocaleDateString("es-CO")}</td>
                <td className="px-2 py-1 border">{p.vehiculos?.codigo_vehiculo || p.vehiculo_id}</td>
                <td className="px-2 py-1 border">{p.conductor}</td>
                <td className="px-2 py-1 border">${parseFloat(p.valor).toLocaleString("es-CO")}</td>
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
