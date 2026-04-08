'use client';

import { useMemo, useState } from 'react';
import { crearConvenio, crearViaje, eliminarConvenio, guardarValidacionAutorizador, eliminarValidacionAutorizador } from './actions';

type Vehiculo = {
  id: number;
  codigo_vehiculo: string;
};

type Convenio = {
  id: number;
  nombre: string;
};

type OperadorRegistrado = {
  id: number;
  nombre: string;
};

type ValidacionAutorizador = {
  operador_id: number;
  operador_nombre: string;
  cedula: string;
  respuesta: string;
};

type UltimoViaje = {
  id: number;
  vehiculo_id: number;
  codigo_vehiculo: string;
  created_at: string;
} | null;

type ViajeListado = {
  id: number;
  created_at: string;
  conductor: string;
  origen: string;
  destino: string;
  medio_contacto: string;
  omite_consecutivo: boolean;
  motivo_omision: string | null;
  codigo_vehiculo: string;
  convenio_nombre: string;
  creado_por_usuario: string;
  autorizador_operador_nombre: string | null;
  cedula_autorizador: string | null;
};

function formatearMedioContacto(medio: string) {
  if (medio === 'llamada_telefonica') return 'Llamada telefónica';
  if (medio === 'whatsapp') return 'WhatsApp';
  if (medio === 'mensajeria_app') return 'Mensajería de la aplicación';
  return medio;
}

export default function ViajesClient({
  rol,
  vehiculos,
  convenios,
  autorizadores,
  validacionesAutorizador,
  ultimoViaje,
  viajes
}: {
  rol: string;
  vehiculos: Vehiculo[];
  convenios: Convenio[];
  autorizadores: OperadorRegistrado[];
  validacionesAutorizador: ValidacionAutorizador[];
  ultimoViaje: UltimoViaje;
  viajes: ViajeListado[];
}) {
  const [loadingViaje, setLoadingViaje] = useState(false);
  const [loadingConvenio, setLoadingConvenio] = useState(false);
  const [loadingEliminarConvenio, setLoadingEliminarConvenio] = useState<number | null>(null);
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  const [loadingEliminarValidacion, setLoadingEliminarValidacion] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [convenioError, setConvenioError] = useState('');
  const [validacionError, setValidacionError] = useState('');
  const [omiteConsecutivo, setOmiteConsecutivo] = useState(false);
  const [vehiculoId, setVehiculoId] = useState('');
  const [nuevoConvenio, setNuevoConvenio] = useState('');
  const [autorizadorIdConfig, setAutorizadorIdConfig] = useState('');
  const [cedulaConfig, setCedulaConfig] = useState('');
  const [respuestaConfig, setRespuestaConfig] = useState('');
  const [editandoValidacionOperadorId, setEditandoValidacionOperadorId] = useState<number | null>(null);

  const vehiculoBloqueado = useMemo(() => {
    if (!ultimoViaje || omiteConsecutivo) return null;
    return ultimoViaje.vehiculo_id;
  }, [ultimoViaje, omiteConsecutivo]);

  async function handleCrearViaje(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingViaje(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    if (omiteConsecutivo) {
      formData.set('omite_consecutivo', '1');
    }

    const result = await crearViaje(formData);
    if (result.error) {
      setError(result.error);
      setLoadingViaje(false);
      return;
    }

    window.location.reload();
  }

  async function handleCrearConvenio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingConvenio(true);
    setConvenioError('');

    const formData = new FormData();
    formData.set('nombre', nuevoConvenio);

    const result = await crearConvenio(formData);
    if (result.error) {
      setConvenioError(result.error);
      setLoadingConvenio(false);
      return;
    }

    window.location.reload();
  }

  async function handleEliminarConvenio(convenioId: number) {
    setLoadingEliminarConvenio(convenioId);
    setConvenioError('');

    const result = await eliminarConvenio(convenioId);
    if (result.error) {
      setConvenioError(result.error);
      setLoadingEliminarConvenio(null);
      return;
    }

    window.location.reload();
  }

  async function handleGuardarValidacion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingValidacion(true);
    setValidacionError('');

    const formData = new FormData();
    formData.set('operador_id', autorizadorIdConfig);
    formData.set('cedula', cedulaConfig);
    formData.set('respuesta', respuestaConfig);

    const result = await guardarValidacionAutorizador(formData);
    if (result.error) {
      setValidacionError(result.error);
      setLoadingValidacion(false);
      return;
    }

    window.location.reload();
  }

  function handleEditarValidacion(validacion: ValidacionAutorizador) {
    setEditandoValidacionOperadorId(validacion.operador_id);
    setAutorizadorIdConfig(String(validacion.operador_id));
    setCedulaConfig(validacion.cedula);
    setRespuestaConfig(validacion.respuesta);
    setValidacionError('');
  }

  function handleCancelarEdicionValidacion() {
    setEditandoValidacionOperadorId(null);
    setAutorizadorIdConfig('');
    setCedulaConfig('');
    setRespuestaConfig('');
    setValidacionError('');
  }

  async function handleEliminarValidacion(operadorId: number) {
    setLoadingEliminarValidacion(operadorId);
    setValidacionError('');

    const result = await eliminarValidacionAutorizador(operadorId);
    if (result.error) {
      setValidacionError(result.error);
      setLoadingEliminarValidacion(null);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Viajes</h1>
            <p className="text-sm text-slate-600">Gestión de solicitudes con protocolo de asignación consecutiva</p>
          </div>
          <a href="/dashboard" className="text-sm font-medium text-blue-700 hover:text-blue-900">
            Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">Descargo de responsabilidad y protocolo para asignación de servicios con cotización</h2>
          <p className="text-sm text-slate-700 mb-3">
            A partir de la fecha, los operadores de la central de despacho están autorizados para gestionar directamente los servicios que requieran cotización. No obstante, es obligatorio cumplir estrictamente con el siguiente protocolo:
          </p>
          <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
            <li>Validar que el conductor cuente con la aplicación de despacho satelital activa.</li>
            <li>Realizar el proceso de contacto en orden consecutivo, iniciando desde el lateral 001 en adelante.</li>
            <li>En caso de que los laterales contactados (ejemplo: del 001 al 040) no respondan o no cuenten con la aplicación, se deberá dejar constancia detallada del proceso realizado.</li>
            <li>Una vez se logre contacto efectivo (ejemplo: lateral 041), el operador deberá coordinar directamente con el conductor la prestación del servicio.</li>
          </ol>
          <p className="text-sm text-slate-700 mt-3">
            Es importante aclarar que la correcta ejecución y registro de este procedimiento es responsabilidad exclusiva del operador que gestiona el servicio, garantizando transparencia, trazabilidad y cumplimiento de los lineamientos establecidos por la central.
          </p>
          <p className="text-sm text-slate-700 mt-3">
            Atentamente,
          </p>
          <p className="text-sm text-slate-700">
            Brayan Arroyave Coordinador de Comunicaciones
          </p>
        </section>

        {ultimoViaje && (
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-blue-900">
              Último lateral asignado: <span className="font-bold">{ultimoViaje.codigo_vehiculo}</span>. La siguiente solicitud debe continuar con otro lateral, salvo omisión justificada.
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Nuevo viaje</h3>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCrearViaje} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lateral *</label>
                  <select
                    name="vehiculo_id"
                    value={vehiculoId}
                    onChange={(e) => setVehiculoId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un lateral</option>
                    {vehiculos.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={vehiculoBloqueado === v.id}
                      >
                        {v.codigo_vehiculo}{vehiculoBloqueado === v.id ? ' (bloqueado por consecutivo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Conductor *</label>
                  <input
                    type="text"
                    name="conductor"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del conductor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Convenio empresarial *</label>
                  <select
                    name="convenio_id"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un convenio</option>
                    {convenios.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medio de contacto *</label>
                  <select
                    name="medio_contacto"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="llamada_telefonica">Llamada telefónica</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="mensajeria_app">Mensajería de la aplicación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origen *</label>
                  <input
                    type="text"
                    name="origen"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Punto de recogida"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destino *</label>
                  <input
                    type="text"
                    name="destino"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Punto de llegada"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Autoriza (operador) *</label>
                  <select
                    name="autorizador_operador_id"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione operador</option>
                    {autorizadores.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del autorizador *</label>
                  <input
                    type="text"
                    name="cedula_autorizador"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Documento validado"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Respuesta de validación *</label>
                  <input
                    type="text"
                    name="respuesta_autorizacion"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Respuesta previamente configurada por administrador"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={omiteConsecutivo}
                    onChange={(e) => setOmiteConsecutivo(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Omitir regla de consecutivo para esta solicitud
                </label>
                <p className="text-xs text-slate-600 mt-1">
                  Solo úselo en casos excepcionales. Debe quedar registro del porqué.
                </p>

                {omiteConsecutivo && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Justificación de omisión *</label>
                    <textarea
                      name="motivo_omision"
                      required={omiteConsecutivo}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Ejemplo: fue el único conductor que contestó"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingViaje}
                className="w-full md:w-auto rounded-lg bg-slate-900 text-white px-5 py-2.5 font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {loadingViaje ? 'Guardando...' : 'Registrar viaje'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Convenios empresariales</h3>
            <p className="text-sm text-slate-600 mb-4">
              {rol === 'administrador'
                ? 'Como administrador puede crear y mantener la lista de convenios.'
                : 'Lista de convenios disponible para asignación de viajes.'}
            </p>

            {rol === 'administrador' && (
              <form onSubmit={handleCrearConvenio} className="space-y-3 mb-4">
                {convenioError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    {convenioError}
                  </div>
                )}
                <input
                  type="text"
                  value={nuevoConvenio}
                  onChange={(e) => setNuevoConvenio(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nuevo convenio empresarial"
                  required
                />
                <button
                  type="submit"
                  disabled={loadingConvenio}
                  className="w-full rounded-lg bg-blue-700 text-white px-4 py-2 font-medium hover:bg-blue-800 disabled:opacity-50"
                >
                  {loadingConvenio ? 'Creando...' : 'Agregar convenio'}
                </button>
              </form>
            )}

            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {convenios.length > 0 ? (
                convenios.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 flex items-center justify-between gap-2">
                    <span>{c.nombre}</span>
                    {rol === 'administrador' && (
                      <button
                        type="button"
                        onClick={() => handleEliminarConvenio(c.id)}
                        className="text-xs rounded bg-red-600 text-white px-2 py-1 hover:bg-red-700 disabled:opacity-50"
                        disabled={loadingEliminarConvenio === c.id}
                      >
                        {loadingEliminarConvenio === c.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No hay convenios registrados.</li>
              )}
            </ul>

            {rol === 'administrador' && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Vincular validación por operador</h4>
                <p className="text-xs text-slate-600 mb-3">
                  Configure por operador la cédula y respuesta que se validarán al autorizar viajes.
                </p>

                {validacionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 mb-3">
                    {validacionError}
                  </div>
                )}

                <form onSubmit={handleGuardarValidacion} className="space-y-2">
                  <select
                    value={autorizadorIdConfig}
                    onChange={(e) => setAutorizadorIdConfig(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione operador</option>
                    {autorizadores.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={cedulaConfig}
                    onChange={(e) => setCedulaConfig(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cédula"
                    required
                  />
                  <input
                    type="text"
                    value={respuestaConfig}
                    onChange={(e) => setRespuestaConfig(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Respuesta de validación"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                    disabled={loadingValidacion}
                  >
                    {loadingValidacion
                      ? 'Guardando...'
                      : editandoValidacionOperadorId
                        ? 'Guardar cambios'
                        : 'Guardar validación'}
                  </button>
                  {editandoValidacionOperadorId && (
                    <button
                      type="button"
                      onClick={handleCancelarEdicionValidacion}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar edición
                    </button>
                  )}
                </form>

                <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                  {validacionesAutorizador.length > 0 ? (
                    validacionesAutorizador.map((v) => (
                      <div key={v.operador_id} className="rounded border border-slate-200 p-2 text-xs text-slate-700">
                        <p><span className="font-semibold">Operador:</span> {v.operador_nombre}</p>
                        <p><span className="font-semibold">Cédula:</span> {v.cedula}</p>
                        <p><span className="font-semibold">Respuesta:</span> {v.respuesta}</p>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => handleEditarValidacion(v)}
                            className="mr-2 rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                          >
                            Editar respuesta
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarValidacion(v.operador_id)}
                            className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                            disabled={loadingEliminarValidacion === v.operador_id}
                          >
                            {loadingEliminarValidacion === v.operador_id ? 'Eliminando...' : 'Eliminar respuesta'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Sin validaciones configuradas.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Últimos viajes registrados</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Lateral</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Conductor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Convenio</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Ruta</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Contacto</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Autorizó</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {viajes.length > 0 ? (
                  viajes.map((v) => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 text-sm text-slate-700 whitespace-nowrap">
                        {new Date(v.created_at).toLocaleString('es-CO')}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-900">{v.codigo_vehiculo}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{v.conductor}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{v.convenio_nombre}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{v.origen} → {v.destino}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">
                        {formatearMedioContacto(v.medio_contacto)}
                        {v.omite_consecutivo && (
                          <span className="block text-xs text-amber-700 mt-1">
                            Omisión: {v.motivo_omision || 'Sin detalle'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700">
                        <span className="font-medium">{v.autorizador_operador_nombre || 'N/A'}</span>
                        <span className="block text-xs text-slate-500">CC: {v.cedula_autorizador || 'N/A'}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700">{v.creado_por_usuario}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-sm text-slate-500">
                      Aún no hay viajes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
