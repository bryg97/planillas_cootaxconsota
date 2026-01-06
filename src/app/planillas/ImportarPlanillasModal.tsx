import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const COLUMNAS_REQUERIDAS = ['numero_planilla', 'fecha', 'codigo_vehiculo', 'conductor', 'operador', 'origen', 'destino', 'valor', 'tipo_pago'];

export default function ImportarPlanillasModal({ onClose, onImport }: { onClose: () => void, onImport: (data: any[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [validacion, setValidacion] = useState<{ errores: string[]; advertencias: string[]; preview: any[] }>({ errores: [], advertencias: [], preview: [] });

  function handleDownloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['numero_planilla', 'fecha', 'codigo_vehiculo', 'conductor', 'operador', 'origen', 'destino', 'valor', 'tipo_pago', 'estado'],
      ['PL-12345678', '2025-12-29', 'J-001', 'Juan Pérez', 'Operador Ejemplo', 'Pereira', 'Consotá', '10000', 'contado', 'pendiente'],
    ]);
    ws['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, 
      { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planillas');
    XLSX.writeFile(wb, 'plantilla_planillas.xlsx');
  }

  function validarDatos(datos: any[]) {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const preview: any[] = [];

    if (datos.length === 0) {
      errores.push('El archivo no contiene datos');
      return { errores, advertencias, preview };
    }

    // Verificar columnas del encabezado
    const primeraFila = datos[0];
    const columnasArchivo = Object.keys(primeraFila).map(c => c.toLowerCase().trim());
    const columnasFaltantes = COLUMNAS_REQUERIDAS.filter(c => !columnasArchivo.includes(c));
    
    if (columnasFaltantes.length > 0) {
      errores.push(`⚠️ Columnas faltantes en el archivo: ${columnasFaltantes.join(', ')}`);
      errores.push(`📋 Columnas encontradas: ${columnasArchivo.join(', ')}`);
    }

    // Validar cada fila
    datos.forEach((fila, index) => {
      const numFila = index + 2; // +2 por encabezado y base 0
      const camposFaltantes: string[] = [];
      
      // Normalizar nombres de columnas (por si hay variaciones)
      const filaNormalizada: any = {};
      Object.keys(fila).forEach(key => {
        filaNormalizada[key.toLowerCase().trim()] = fila[key];
      });

      // Verificar campos requeridos
      if (!filaNormalizada.numero_planilla) camposFaltantes.push('numero_planilla');
      if (!filaNormalizada.fecha) camposFaltantes.push('fecha');
      if (!filaNormalizada.codigo_vehiculo && !filaNormalizada.vehiculo_id) camposFaltantes.push('codigo_vehiculo');
      if (!filaNormalizada.conductor) camposFaltantes.push('conductor');
      if (!filaNormalizada.operador) camposFaltantes.push('operador');
      if (!filaNormalizada.origen) camposFaltantes.push('origen');
      if (!filaNormalizada.destino) camposFaltantes.push('destino');
      if (!filaNormalizada.valor && filaNormalizada.valor !== 0) camposFaltantes.push('valor');
      if (!filaNormalizada.tipo_pago) camposFaltantes.push('tipo_pago');

      if (camposFaltantes.length > 0) {
        errores.push(`Fila ${numFila}: Campos vacíos → ${camposFaltantes.join(', ')}`);
      } else {
        preview.push({
          fila: numFila,
          numero_planilla: filaNormalizada.numero_planilla,
          codigo_vehiculo: filaNormalizada.codigo_vehiculo || filaNormalizada.vehiculo_id,
          conductor: filaNormalizada.conductor,
          valor: filaNormalizada.valor
        });
      }

      // Advertencias
      if (!filaNormalizada.estado) {
        advertencias.push(`Fila ${numFila}: Sin estado, se usará "pendiente"`);
      }
    });

    return { errores, advertencias, preview };
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    setSuccess('');
    setValidacion({ errores: [], advertencias: [], preview: [] });
    
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

      // Normalizar fechas y columnas
      const normalizados = json.map((row: any) => {
        const copia: any = {};
        Object.keys(row).forEach(key => {
          copia[key.toLowerCase().trim()] = row[key];
        });
        
        if (copia.fecha && typeof copia.fecha === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const fecha = new Date(excelEpoch.getTime() + (copia.fecha * 24 * 60 * 60 * 1000));
          copia.fecha = fecha.toISOString().slice(0, 10);
        }
        return copia;
      });

      // Validar datos
      const resultado = validarDatos(normalizados);
      setValidacion(resultado);
      
      if (resultado.errores.length === 0 || resultado.preview.length > 0) {
        setData(normalizados);
        if (resultado.preview.length > 0) {
          setSuccess(`✅ ${resultado.preview.length} fila(s) válida(s) lista(s) para importar`);
        }
      } else {
        setData([]);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Importar Planillas desde Excel</h2>
        
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded text-sm">
          <strong>💡 Columnas requeridas:</strong><br/>
          <code className="text-xs">numero_planilla, fecha, codigo_vehiculo, conductor, operador, origen, destino, valor, tipo_pago</code>
        </div>
        
        <button onClick={handleDownloadTemplate} className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          📥 Descargar plantilla Excel
        </button>
        
        <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="mb-4 block w-full" />
        
        {/* Errores de validación */}
        {validacion.errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm max-h-40 overflow-y-auto">
            <strong>❌ Errores encontrados:</strong>
            <ul className="mt-2 list-disc list-inside">
              {validacion.errores.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Advertencias */}
        {validacion.advertencias.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4 text-sm max-h-32 overflow-y-auto">
            <strong>⚠️ Advertencias:</strong>
            <ul className="mt-2 list-disc list-inside">
              {validacion.advertencias.slice(0, 5).map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
              {validacion.advertencias.length > 5 && (
                <li>... y {validacion.advertencias.length - 5} más</li>
              )}
            </ul>
          </div>
        )}
        
        {/* Preview de datos válidos */}
        {validacion.preview.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 p-3 rounded mb-4 text-sm">
            <strong>📋 Vista previa ({validacion.preview.length} filas válidas):</strong>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1">Fila</th>
                    <th className="px-2 py-1">N° Planilla</th>
                    <th className="px-2 py-1">Vehículo</th>
                    <th className="px-2 py-1">Conductor</th>
                    <th className="px-2 py-1">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {validacion.preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{row.fila}</td>
                      <td className="px-2 py-1">{row.numero_planilla}</td>
                      <td className="px-2 py-1">{row.codigo_vehiculo}</td>
                      <td className="px-2 py-1">{row.conductor}</td>
                      <td className="px-2 py-1">${Number(row.valor).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validacion.preview.length > 5 && (
                <p className="text-gray-500 mt-1">... y {validacion.preview.length - 5} filas más</p>
              )}
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}
        
        {data.length > 0 && validacion.preview.length > 0 && (
          <button
            onClick={() => onImport(data)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 mt-2"
          >
            🚀 Importar {validacion.preview.length} planilla(s)
          </button>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
