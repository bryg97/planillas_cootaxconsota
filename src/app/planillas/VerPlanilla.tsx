'use client';

export default function VerPlanilla({ 
  planilla, 
  onClose 
}: { 
  planilla: any; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalles de Planilla</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Número de Planilla
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {planilla.numero_planilla}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(planilla.fecha).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Vehículo
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {planilla.vehiculos?.codigo_vehiculo}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Conductor
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {planilla.conductor}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Operador
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {planilla.operador || '-'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Valor
            </label>
            <p className="text-2xl font-bold text-green-600">
              ${parseFloat(planilla.valor).toLocaleString('es-CO')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo de Pago
            </label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              planilla.tipo_pago === 'contado' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {planilla.tipo_pago}
            </span>
          </div>

          {planilla.origen && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Origen
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {planilla.origen}
              </p>
            </div>
          )}

          {planilla.destino && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Destino
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {planilla.destino}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado
            </label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              planilla.estado === 'recaudada' ? 'bg-blue-100 text-blue-800' :
              planilla.estado === 'pagada' ? 'bg-green-100 text-green-800' :
              planilla.estado === 'liquidada' ? 'bg-purple-100 text-purple-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {planilla.estado}
            </span>
          </div>

          {planilla.usuarios?.usuario && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Creado por
              </label>
              <p className="text-sm text-gray-700">
                {planilla.usuarios.usuario}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
