'use client';

export default function VerVehiculo({ vehiculo, onClose }: { vehiculo: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalles del Vehículo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Código del Vehículo
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {vehiculo.codigo_vehiculo}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Saldo
              </label>
              <p className="text-lg font-semibold text-gray-900">
                ${parseFloat(vehiculo.saldo).toLocaleString('es-CO')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Saldo Pendiente
              </label>
              <p className={`text-lg font-semibold ${
                vehiculo.saldo_pendiente > 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                ${parseFloat(vehiculo.saldo_pendiente).toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha de Registro
            </label>
            <p className="text-lg text-gray-900">
              {new Date(vehiculo.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado
            </label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
              vehiculo.saldo_pendiente > 0 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {vehiculo.saldo_pendiente > 0 ? 'Con Deuda' : 'Al Día'}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
