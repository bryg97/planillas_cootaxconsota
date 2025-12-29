import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportarPlanillasModal({ onClose, onImport }: { onClose: () => void, onImport: (data: any[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<any[]>([]);

  function handleDownloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['numero_planilla', 'fecha', 'vehiculo_id', 'conductor', 'operador', 'origen', 'destino', 'valor', 'tipo_pago', 'estado'],
      ['PL-12345678', '2025-12-29', '1', 'Juan Pérez', 'Operador Ejemplo', 'Cúcuta', 'Pamplona', '10000', 'contado', 'pendiente'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planillas');
    XLSX.writeFile(wb, 'plantilla_planillas.xlsx');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    setSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const arr = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(arr, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!Array.isArray(json) || json.length === 0) {
        setError('El archivo está vacío o no tiene datos válidos.');
        setData([]);
        return;
      }
      // Normalizar fechas: convertir números de Excel a yyyy-mm-dd
      const normalizados = json.map((row: any) => {
        const copia = { ...row };
        if (copia.fecha && typeof copia.fecha === 'number') {
          // Excel: días desde 1899-12-30
          const excelEpoch = new Date(1899, 11, 30);
          const fecha = new Date(excelEpoch.getTime() + (copia.fecha * 24 * 60 * 60 * 1000));
          copia.fecha = fecha.toISOString().slice(0, 10);
        }
        return copia;
      });
      setData(normalizados);
      setSuccess('Archivo leído correctamente. Listo para importar.');
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Importar Planillas desde Excel</h2>
        <button onClick={handleDownloadTemplate} className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Descargar plantilla Excel</button>
        <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="mb-4 block" />
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}
        {data.length > 0 && (
          <button
            onClick={() => onImport(data)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 mt-2"
          >
            Importar
          </button>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
