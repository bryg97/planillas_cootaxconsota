'use client';

import { useState } from 'react';
import { importarVehiculos } from './actions';

export default function ImportarVehiculosClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await importarVehiculos(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Importación completada');
      // Limpiar el formulario
      (e.target as HTMLFormElement).reset();
      setFileName('');
    }

    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Importar Vehículos</h1>
          <a href="/vehiculos" className="text-blue-600 hover:text-blue-800">
            ← Volver a Vehículos
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Instrucciones</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Descarga la plantilla de Excel haciendo clic en el botón de abajo</li>
            <li>Llena la plantilla con los datos de tus vehículos</li>
            <li>Guarda el archivo (puede ser .xlsx, .xls o .csv)</li>
            <li>Sube el archivo usando el formulario</li>
          </ol>
          
          <div className="mt-4">
            <a
              href="/plantillas/vehiculos-plantilla.csv"
              download="vehiculos-plantilla.csv"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Plantilla
            </a>
          </div>
        </div>

        {/* Formato de la plantilla */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3">Formato de la Plantilla</h3>
          <p className="text-gray-600 mb-4">
            La plantilla debe contener las siguientes columnas:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                    codigo_vehiculo *
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                    saldo
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                    saldo_pendiente
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">TXI-001</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">0</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">0</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 border border-gray-300 text-sm">TXI-002</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">15000</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">5000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            * Campo obligatorio
          </p>
        </div>

        {/* Formulario de carga */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Subir Archivo</h3>

          {message && (
            <div className="bg-green-50 text-green-700 p-4 rounded mb-4 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo (.xlsx, .xls o .csv)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="mt-2 text-sm text-gray-600">
                    {fileName || 'Haz clic o arrastra el archivo aquí'}
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept=".xlsx,.xls,.csv"
                    required
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </span>
              ) : (
                'Importar Vehículos'
              )}
            </button>
          </form>
        </div>

        {/* Nota importante */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Los vehículos con códigos duplicados no se importarán. El proceso puede tardar varios segundos si el archivo es grande.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
