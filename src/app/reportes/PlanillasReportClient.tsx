"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function PlanillasReportClient({ planillas }: { planillas: any[] }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  function handleExportExcel() {
    const ws = XLSX.utils.json_to_sheet(planillasFiltradas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planillas");
    XLSX.writeFile(wb, "reporte_planillas.xlsx");
  }

  function handlePrint() {
    window.print();
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <label>Desde:</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border px-2 py-1 rounded" />
          <label>Hasta:</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 print:hidden">Imprimir</button>
        </div>
      </div>
      <div className="overflow-x-auto">
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
