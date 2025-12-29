"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function LiquidacionesReportClient({ liquidaciones }: { liquidaciones: any[] }) {
  const [search, setSearch] = useState("");

  function handleExportExcel() {
    const ws = XLSX.utils.json_to_sheet(liquidaciones);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Liquidaciones");
    XLSX.writeFile(wb, "reporte_liquidaciones.xlsx");
  }

  function handlePrint() {
    const printContents = document.getElementById('liquidaciones-table')?.outerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=600,width=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Liquidaciones</title>
          <style>
            body { font-family: sans-serif; margin: 40px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>
          <h2>Reporte de Liquidaciones</h2>
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

  const filtered = liquidaciones.filter(l =>
    l.conductor?.toLowerCase().includes(search.toLowerCase()) ||
    l.numero_liquidacion?.toString().includes(search)
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 print:bg-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por conductor o número..."
          className="border px-3 py-2 rounded w-full md:w-1/3"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 print:hidden">Imprimir</button>
        </div>
      </div>
      <div className="overflow-x-auto" id="liquidaciones-table">
        <table className="min-w-full border text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">N°</th>
              <th className="px-2 py-1 border">Fecha</th>
              <th className="px-2 py-1 border">Conductor</th>
              <th className="px-2 py-1 border">Valor</th>
              <th className="px-2 py-1 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((liq, i) => (
              <tr key={liq.id} className="hover:bg-blue-50">
                <td className="px-2 py-1 border">{liq.numero_liquidacion}</td>
                <td className="px-2 py-1 border">{new Date(liq.fecha).toLocaleDateString("es-CO")}</td>
                <td className="px-2 py-1 border">{liq.conductor}</td>
                <td className="px-2 py-1 border">${parseFloat(liq.valor).toLocaleString("es-CO")}</td>
                <td className="px-2 py-1 border capitalize">{liq.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="text-center text-gray-500 py-8">No hay liquidaciones para mostrar.</div>}
    </div>
  );
}
