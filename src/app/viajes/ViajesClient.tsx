'use client';

import { useMemo, useRef, useState } from 'react';
import { crearConvenio, crearViaje, editarViaje, eliminarConvenio, guardarValidacionAutorizador, eliminarValidacionAutorizador, eliminarViajesPorLateral } from './actions';
import FormPlanilla from '../planillas/FormPlanilla';

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
  planilla_id: number | null;
  vehiculo_id: number;
  convenio_id: number;
  conductor: string;
  origen: string;
  destino: string;
  medio_contacto: string;
  omite_consecutivo: boolean;
  motivo_omision: string | null;
  codigo_vehiculo: string;
  convenio_nombre: string;
  creado_por_usuario: string;
  autorizador_operador_id: number | null;
  autorizador_operador_nombre: string | null;
  cedula_autorizador: string | null;
  respuesta_autorizacion: string | null;
  numero_planilla: string | null;
};

type PlanillaDisponible = {
  id: number;
  numero_planilla: string;
  vehiculo_id: number | null;
  codigo_vehiculo: string | null;
  fecha: string;
  estado: string;
  conductor: string | null;
};

type PlanillaCreada = {
  id: number;
  numero_planilla: string;
  vehiculo_id: number;
  fecha: string;
  estado: string;
  conductor: string;
};

function formatearMedioContacto(medio: string) {
  if (medio === 'llamada_telefonica') return 'Llamada telefónica';
  if (medio === 'whatsapp') return 'WhatsApp';
  if (medio === 'mensajeria_app') return 'Mensajería de la aplicación';
  return medio;
}

function normalizarBusqueda(texto: string) {
  return texto.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function ViajesClient({
  rol,
  vehiculos,
  convenios,
  autorizadores,
  validacionesAutorizador,
  ultimoViaje,
  viajes,
  planillasDisponibles,
  valorPlanillaDefecto
}: {
  rol: string;
  vehiculos: Vehiculo[];
  convenios: Convenio[];
  autorizadores: OperadorRegistrado[];
  validacionesAutorizador: ValidacionAutorizador[];
  ultimoViaje: UltimoViaje;
  viajes: ViajeListado[];
  planillasDisponibles: PlanillaDisponible[];
  valorPlanillaDefecto?: number;
}) {
  const formViajeRef = useRef<HTMLFormElement>(null);
  const [loadingViaje, setLoadingViaje] = useState(false);
  const [loadingConvenio, setLoadingConvenio] = useState(false);
  const [loadingEliminarConvenio, setLoadingEliminarConvenio] = useState<number | null>(null);
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  const [loadingEliminarValidacion, setLoadingEliminarValidacion] = useState<number | null>(null);
  const [loadingEliminarViajes, setLoadingEliminarViajes] = useState(false);
  const [error, setError] = useState('');
  const [convenioError, setConvenioError] = useState('');
  const [validacionError, setValidacionError] = useState('');
  const [omiteConsecutivo, setOmiteConsecutivo] = useState(false);
  const [vehiculoId, setVehiculoId] = useState('');
  const [lateralBusqueda, setLateralBusqueda] = useState('');
  const [nuevoConvenio, setNuevoConvenio] = useState('');
  const [autorizadorIdConfig, setAutorizadorIdConfig] = useState('');
  const [cedulaConfig, setCedulaConfig] = useState('');
  const [respuestaConfig, setRespuestaConfig] = useState('');
  const [editandoValidacionOperadorId, setEditandoValidacionOperadorId] = useState<number | null>(null);
  const [lateralEliminarId, setLateralEliminarId] = useState('');
  const [errorEliminarViajes, setErrorEliminarViajes] = useState('');
  const [mostrarModalPlanilla, setMostrarModalPlanilla] = useState(false);
  const [mostrarFormularioPlanilla, setMostrarFormularioPlanilla] = useState(false);
  const [planillaSeleccionadaId, setPlanillaSeleccionadaId] = useState('');
  const [planillaBusqueda, setPlanillaBusqueda] = useState('');
  const [errorPlanilla, setErrorPlanilla] = useState('');
  const [planillasDisponiblesState, setPlanillasDisponiblesState] = useState(planillasDisponibles);
  const [mostrarModalEditarViaje, setMostrarModalEditarViaje] = useState(false);
  const [loadingEditarViaje, setLoadingEditarViaje] = useState(false);
  const [errorEditarViaje, setErrorEditarViaje] = useState('');
  const [editViajeId, setEditViajeId] = useState('');
  const [editVehiculoId, setEditVehiculoId] = useState('');
  const [editPlanillaId, setEditPlanillaId] = useState('');
  const [editConductor, setEditConductor] = useState('');
  const [editConvenioId, setEditConvenioId] = useState('');
  const [editOrigen, setEditOrigen] = useState('');
  const [editDestino, setEditDestino] = useState('');
  const [editMedioContacto, setEditMedioContacto] = useState('');
  const [editAutorizadorId, setEditAutorizadorId] = useState('');
  const [editCedulaAutorizador, setEditCedulaAutorizador] = useState('');
  const [editRespuestaAutorizacion, setEditRespuestaAutorizacion] = useState('');
  const [editOmiteConsecutivo, setEditOmiteConsecutivo] = useState(false);
  const [editMotivoOmision, setEditMotivoOmision] = useState('');
  const [mostrarModalConfirmarEdicion, setMostrarModalConfirmarEdicion] = useState(false);
  const [mostrarModalConfirmarEliminacion, setMostrarModalConfirmarEliminacion] = useState(false);
  const [modalExito, setModalExito] = useState<{ titulo: string; detalle: string[] } | null>(null);

  const vehiculoBloqueado = useMemo(() => {
    if (!ultimoViaje || omiteConsecutivo) return null;
    return ultimoViaje.vehiculo_id;
  }, [ultimoViaje, omiteConsecutivo]);

  const lateralesFiltrados = useMemo(() => {
    const busqueda = normalizarBusqueda(lateralBusqueda.trim());
    if (!busqueda) return vehiculos;
    return vehiculos.filter((v) => normalizarBusqueda(v.codigo_vehiculo).includes(busqueda));
  }, [vehiculos, lateralBusqueda]);

  const planillasDelLateral = useMemo(() => {
    const lateralId = parseInt(vehiculoId, 10);
    if (!lateralId) return [];

    return planillasDisponiblesState.filter((p) => p.vehiculo_id === lateralId);
  }, [planillasDisponiblesState, vehiculoId]);

  const planillasDelLateralFiltradas = useMemo(() => {
    const busqueda = planillaBusqueda.trim().toLowerCase();
    if (!busqueda) return planillasDelLateral;

    return planillasDelLateral.filter((p) => {
      const fechaIso = p.fecha ? new Date(p.fecha).toISOString().slice(0, 10) : '';
      const fechaLocal = p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '';
      const base = [p.numero_planilla, p.estado, p.conductor || '', fechaIso, fechaLocal]
        .join(' ')
        .toLowerCase();
      return base.includes(busqueda);
    });
  }, [planillasDelLateral, planillaBusqueda]);

  const planillaSeleccionada = useMemo(
    () => planillasDisponiblesState.find((p) => String(p.id) === planillaSeleccionadaId),
    [planillasDisponiblesState, planillaSeleccionadaId]
  );

  const planillasEditablesDelLateral = useMemo(() => {
    const lateralId = parseInt(editVehiculoId, 10);
    if (!lateralId) return [];

    return planillasDisponiblesState.filter((p) => p.vehiculo_id === lateralId);
  }, [planillasDisponiblesState, editVehiculoId]);

  const lateralSeleccionadoEdicion = useMemo(
    () => vehiculos.find((v) => String(v.id) === editVehiculoId),
    [vehiculos, editVehiculoId]
  );

  const planillaSeleccionadaEdicion = useMemo(
    () => planillasDisponiblesState.find((p) => String(p.id) === editPlanillaId),
    [planillasDisponiblesState, editPlanillaId]
  );

  const lateralSeleccionadoEliminar = useMemo(
    () => vehiculos.find((v) => String(v.id) === lateralEliminarId),
    [vehiculos, lateralEliminarId]
  );

  function handlePlanillaCreada(planilla: PlanillaCreada) {
    const vehiculoCreado = vehiculos.find((v) => v.id === planilla.vehiculo_id);

    const nuevaPlanilla: PlanillaDisponible = {
      id: planilla.id,
      numero_planilla: planilla.numero_planilla,
      vehiculo_id: planilla.vehiculo_id,
      codigo_vehiculo: vehiculoCreado?.codigo_vehiculo || null,
      fecha: planilla.fecha,
      estado: planilla.estado,
      conductor: planilla.conductor || null
    };

    setPlanillasDisponiblesState((prev) => {
      const sinDuplicado = prev.filter((p) => p.id !== nuevaPlanilla.id);
      return [nuevaPlanilla, ...sinDuplicado];
    });
    setPlanillaSeleccionadaId(String(planilla.id));
    setErrorPlanilla('');
    setMostrarFormularioPlanilla(false);
    setMostrarModalPlanilla(true);
  }

  async function handleCrearViaje(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingViaje(true);
    setError('');
    setErrorPlanilla('');

    if (!planillaSeleccionadaId) {
      setMostrarModalPlanilla(true);
      setLoadingViaje(false);
      return;
    }

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

  function confirmarPlanillaYRegistrar() {
    if (!vehiculoId) {
      setErrorPlanilla('Primero seleccione un lateral para poder elegir su planilla.');
      return;
    }

    if (!planillaSeleccionadaId) {
      setErrorPlanilla('Seleccione una planilla para continuar con el registro.');
      return;
    }

    setMostrarModalPlanilla(false);
    formViajeRef.current?.requestSubmit();
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

  async function handleEliminarViajesPorLateral() {
    if (!lateralEliminarId) {
      setErrorEliminarViajes('Seleccione un lateral para eliminar sus registros.');
      return;
    }

    setErrorEliminarViajes('');
    setMostrarModalConfirmarEliminacion(true);
  }

  async function confirmarEliminarViajesPorLateral() {
    if (!lateralEliminarId) {
      setErrorEliminarViajes('Seleccione un lateral para eliminar sus registros.');
      setMostrarModalConfirmarEliminacion(false);
      return;
    }

    setLoadingEliminarViajes(true);
    setErrorEliminarViajes('');

    const result = await eliminarViajesPorLateral(parseInt(lateralEliminarId, 10));
    if (result.error) {
      setErrorEliminarViajes(result.error);
      setLoadingEliminarViajes(false);
      setMostrarModalConfirmarEliminacion(false);
      return;
    }

    setLoadingEliminarViajes(false);
    setMostrarModalConfirmarEliminacion(false);
    setModalExito({
      titulo: 'Registros eliminados',
      detalle: [
        `Lateral: ${lateralSeleccionadoEliminar?.codigo_vehiculo || lateralEliminarId}`,
        `Registros eliminados: ${result.eliminados || 0}`
      ]
    });
  }

  function handleAbrirEditarViaje(viaje: ViajeListado) {
    setEditViajeId(String(viaje.id));
    setEditVehiculoId(String(viaje.vehiculo_id));
    setEditPlanillaId(viaje.planilla_id ? String(viaje.planilla_id) : '');
    setEditConductor(viaje.conductor || '');
    setEditConvenioId(String(viaje.convenio_id));
    setEditOrigen(viaje.origen || '');
    setEditDestino(viaje.destino || '');
    setEditMedioContacto(viaje.medio_contacto || '');
    setEditAutorizadorId(viaje.autorizador_operador_id ? String(viaje.autorizador_operador_id) : '');
    setEditCedulaAutorizador(viaje.cedula_autorizador || '');
    setEditRespuestaAutorizacion(viaje.respuesta_autorizacion || '');
    setEditOmiteConsecutivo(Boolean(viaje.omite_consecutivo));
    setEditMotivoOmision(viaje.motivo_omision || '');
    setErrorEditarViaje('');
    setMostrarModalEditarViaje(true);
  }

  function handleCerrarEditarViaje() {
    setMostrarModalEditarViaje(false);
    setErrorEditarViaje('');
  }

  async function handleGuardarEdicionViaje(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorEditarViaje('');
    setMostrarModalConfirmarEdicion(true);
  }

  async function confirmarGuardarEdicionViaje() {
    setLoadingEditarViaje(true);
    setErrorEditarViaje('');

    const formData = new FormData();
    formData.set('viaje_id', editViajeId);
    formData.set('vehiculo_id', editVehiculoId);
    formData.set('planilla_id', editPlanillaId);
    formData.set('conductor', editConductor);
    formData.set('convenio_id', editConvenioId);
    formData.set('origen', editOrigen);
    formData.set('destino', editDestino);
    formData.set('medio_contacto', editMedioContacto);
    formData.set('autorizador_operador_id', editAutorizadorId);
    formData.set('cedula_autorizador', editCedulaAutorizador);
    formData.set('respuesta_autorizacion', editRespuestaAutorizacion);
    if (editOmiteConsecutivo) {
      formData.set('omite_consecutivo', '1');
    }
    formData.set('motivo_omision', editMotivoOmision);

    const result = await editarViaje(formData);
    if (result.error) {
      setErrorEditarViaje(result.error);
      setLoadingEditarViaje(false);
      setMostrarModalConfirmarEdicion(false);
      return;
    }

    setLoadingEditarViaje(false);
    setMostrarModalConfirmarEdicion(false);
    setMostrarModalEditarViaje(false);
    setModalExito({
      titulo: 'Viaje actualizado correctamente',
      detalle: [
        `ID: ${editViajeId}`,
        `Lateral: ${lateralSeleccionadoEdicion?.codigo_vehiculo || editVehiculoId}`,
        `Planilla: ${planillaSeleccionadaEdicion?.numero_planilla || editPlanillaId}`
      ]
    });
  }

  function cerrarModalExitoYRecargar() {
    setModalExito(null);
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <section className="overflow-hidden rounded-none bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
              Viajes
            </div>
            <h1 className="mt-4 text-3xl font-bold">Gestión de solicitudes</h1>
            <p className="mt-2 text-base text-white/90">Protocolo de asignación consecutiva para laterales con trazabilidad completa</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/dashboard" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              Volver
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50 via-white to-amber-50 border border-amber-200 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-4">
              <svg className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-amber-900">Protocolo obligatorio para asignación con cotización</h2>
                <p className="mt-1 text-sm text-amber-800">Descargo de responsabilidad y procedimiento reglamentario</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-4">
              A partir de la fecha, los operadores de la central de despacho están autorizados para gestionar directamente los servicios que requieran cotización. No obstante, es obligatorio cumplir estrictamente con el siguiente protocolo:
            </p>
            <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-2 mb-4">
              <li>Validar que el conductor cuente con la aplicación de despacho satelital activa.</li>
              <li>Realizar el proceso de contacto en orden consecutivo, iniciando desde el lateral 001 en adelante.</li>
              <li>En caso de que los laterales contactados (ejemplo: del 001 al 040) no respondan o no cuenten con la aplicación, se deberá dejar constancia detallada del proceso realizado.</li>
              <li>Una vez se logre contacto efectivo (ejemplo: lateral 041), el operador deberá coordinar directamente con el conductor la prestación del servicio.</li>
            </ol>
            <p className="text-sm text-slate-700 mb-3">
              Es importante aclarar que la correcta ejecución y registro de este procedimiento es responsabilidad exclusiva del operador que gestiona el servicio, garantizando transparencia, trazabilidad y cumplimiento de los lineamientos establecidos por la central.
            </p>
            <div className="pt-4 border-t border-amber-200">
              <p className="text-xs font-medium text-slate-600 mb-1">Brayan Arroyave</p>
              <p className="text-xs text-slate-600">Coordinador de Comunicaciones</p>
            </div>
          </div>
        </section>

        {ultimoViaje && (
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Último lateral asignado: <span className="font-bold text-lg">{ultimoViaje.codigo_vehiculo}</span></p>
                  <p className="text-sm text-blue-800 mt-1">La siguiente solicitud debe continuar con otro lateral, salvo omisión justificada.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Crear viaje</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Registrar nueva solicitud</h3>
              <p className="mt-1 text-sm text-slate-600">
                Complete los datos de la solicitud respetando el protocolo de asignación consecutiva de laterales.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form ref={formViajeRef} onSubmit={handleCrearViaje} className="space-y-6">
              <input type="hidden" name="planilla_id" value={planillaSeleccionadaId} />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.15em]">Información del viaje</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Lateral *</label>
                    <input
                      type="text"
                      value={lateralBusqueda}
                      onChange={(e) => setLateralBusqueda(e.target.value)}
                      className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Buscar lateral..."
                    />
                    <select
                      name="vehiculo_id"
                      value={vehiculoId}
                      onChange={(e) => {
                        setVehiculoId(e.target.value);
                        setPlanillaSeleccionadaId('');
                      }}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccione un lateral</option>
                      {lateralesFiltrados.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                          disabled={vehiculoBloqueado === v.id}
                        >
                          {v.codigo_vehiculo}{vehiculoBloqueado === v.id ? ' (bloqueado por consecutivo)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorPlanilla('');
                        setMostrarModalPlanilla(true);
                      }}
                      className="mt-3 w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      {planillaSeleccionada ? 'Cambiar planilla seleccionada' : 'Seleccionar planilla del lateral'}
                    </button>
                    {planillaSeleccionada ? (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        Planilla seleccionada: <span className="font-bold">{planillaSeleccionada.numero_planilla}</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">Debe seleccionar una planilla antes de registrar el viaje.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Conductor *</label>
                    <input
                      type="text"
                      name="conductor"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Nombre del conductor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Convenio empresarial *</label>
                    <select
                      name="convenio_id"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccione un convenio</option>
                      {convenios.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Medio de contacto *</label>
                    <select
                      name="medio_contacto"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccione</option>
                      <option value="llamada_telefonica">Llamada telefónica</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="mensajeria_app">Mensajería de la aplicación</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Origen *</label>
                    <input
                      type="text"
                      name="origen"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Punto de recogida"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Destino *</label>
                    <input
                      type="text"
                      name="destino"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Punto de llegada"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.15em]">Autorización</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Autoriza (operador) *</label>
                    <select
                      name="autorizador_operador_id"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccione operador</option>
                      {autorizadores.map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cédula del autorizador *</label>
                    <input
                      type="text"
                      name="cedula_autorizador"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Documento validado"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Código de seguridad *</label>
                  <input
                    type="text"
                    name="respuesta_autorizacion"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Código previamente configurado por administrador"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <label className="flex items-start gap-3 text-sm font-medium text-amber-900">
                  <input
                    type="checkbox"
                    checked={omiteConsecutivo}
                    onChange={(e) => setOmiteConsecutivo(e.target.checked)}
                    className="h-5 w-5 rounded mt-0.5"
                  />
                  <span>Omitir regla de consecutivo para esta solicitud</span>
                </label>
                <p className="text-xs text-amber-800 mt-2 ml-8">
                  Solo úselo en casos excepcionales. Debe quedar registro del porqué.
                </p>

                {omiteConsecutivo && (
                  <div className="mt-3 ml-8">
                    <label className="block text-sm font-semibold text-amber-900 mb-2">Justificación de omisión *</label>
                    <textarea
                      name="motivo_omision"
                      required={omiteConsecutivo}
                      className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                      rows={2}
                      placeholder="Ejemplo: fue el único conductor que contestó"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingViaje}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingViaje
                  ? 'Registrando viaje...'
                  : planillaSeleccionada
                    ? 'Registrar viaje'
                    : 'Seleccionar planilla y registrar viaje'}
              </button>
            </form>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Información de ayuda</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Protocolo</div>
                  <div className="mt-2 text-sm text-slate-200">Respete el orden consecutivo de laterales. Cada nuevo viaje debe asignarse al siguiente lateral disponible.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-medium mb-2">Puntos clave:</p>
                  <ul className="space-y-1 text-xs">
                    <li>✓ Validar app satelital activa</li>
                    <li>✓ Contacto en orden consecutivo</li>
                    <li>✓ Registrar intentos fallidos</li>
                    <li>✓ Documentar omisiones</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.15em]">Estado del consecutivo</h3>
              <p className="mt-2 text-xs text-slate-600 mb-4">
                Sistema automático de control de laterales
              </p>
              {ultimoViaje ? (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-600 mb-1">Último lateral:</div>
                  <div className="text-lg font-bold text-slate-900">{ultimoViaje.codigo_vehiculo}</div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 text-center">
                  Sin registros previos
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Configuración</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Convenios empresariales</h3>
              <p className="mt-1 text-sm text-slate-600">
                {rol === 'administrador'
                  ? 'Cree y mantenga la lista de convenios para asignación de viajes.'
                  : 'Lista de convenios disponible para asignación de viajes.'}
              </p>
            </div>

            {rol === 'administrador' && (
              <form onSubmit={handleCrearConvenio} className="mb-6 p-4 rounded-2xl border border-blue-200 bg-blue-50">
                {convenioError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 mb-3">
                    {convenioError}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-2">Nuevo convenio</label>
                    <input
                      type="text"
                      value={nuevoConvenio}
                      onChange={(e) => setNuevoConvenio(e.target.value)}
                      className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Nombre del convenio"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingConvenio}
                    className="w-full rounded-xl bg-blue-600 text-white px-4 py-2.5 font-medium transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {loadingConvenio ? 'Creando...' : '+ Agregar convenio'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {convenios.length > 0 ? (
                convenios.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{c.nombre}</span>
                    {rol === 'administrador' && (
                      <button
                        type="button"
                        onClick={() => handleEliminarConvenio(c.id)}
                        className="text-xs rounded-lg bg-red-100 text-red-700 px-2.5 py-1.5 font-medium hover:bg-red-200 transition disabled:opacity-50"
                        disabled={loadingEliminarConvenio === c.id}
                      >
                        {loadingEliminarConvenio === c.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No hay convenios registrados
                </div>
              )}
            </div>
          </div>

          {rol === 'administrador' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Seguridad</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Validaciones de autorizadores</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Configure cédula y código de seguridad por operador autorizador.
                </p>
              </div>

              {validacionError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {validacionError}
                </div>
              )}

              <form onSubmit={handleGuardarValidacion} className="mb-6 p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Operador autorizador</label>
                  <select
                    value={autorizadorIdConfig}
                    onChange={(e) => setAutorizadorIdConfig(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Seleccione operador</option>
                    {autorizadores.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Cédula</label>
                    <input
                      type="text"
                      value={cedulaConfig}
                      onChange={(e) => setCedulaConfig(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Documento"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Código de seguridad</label>
                    <input
                      type="text"
                      value={respuestaConfig}
                      onChange={(e) => setRespuestaConfig(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="PIN o código"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
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
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {validacionesAutorizador.length > 0 ? (
                  validacionesAutorizador.map((v) => (
                    <div key={v.operador_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{v.operador_nombre}</p>
                          <p className="text-xs text-slate-600 mt-1">CC: {v.cedula}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditarValidacion(v)}
                            className="rounded-lg bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-medium hover:bg-blue-200 transition"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarValidacion(v.operador_id)}
                            className="rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-medium hover:bg-red-200 transition disabled:opacity-50"
                            disabled={loadingEliminarValidacion === v.operador_id}
                          >
                            {loadingEliminarValidacion === v.operador_id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-600">Código:</p>
                        <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{v.respuesta}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Sin validaciones configuradas
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Histórico</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Viajes registrados</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {viajes.length} registros
            </span>
          </div>

          {rol === 'administrador' && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3 mb-4">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-red-900">Administración de histórico por lateral</p>
                  <p className="text-xs text-red-800 mt-1">
                    Elimina todos los registros de viajes del lateral seleccionado. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              
              {errorEliminarViajes && (
                <div className="mb-3 rounded-lg border border-red-300 bg-white p-2 text-xs text-red-700">
                  {errorEliminarViajes}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-red-900 mb-2">Lateral a eliminar</label>
                  <select
                    value={lateralEliminarId}
                    onChange={(e) => setLateralEliminarId(e.target.value)}
                    className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">Seleccione lateral</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.codigo_vehiculo}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleEliminarViajesPorLateral}
                  className="rounded-xl bg-red-700 text-white px-4 py-3 text-sm font-medium transition hover:bg-red-800 disabled:opacity-50"
                  disabled={loadingEliminarViajes}
                >
                  {loadingEliminarViajes ? 'Eliminando...' : 'Eliminar registros'}
                </button>
              </div>
            </div>
          )}

          {viajes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-700">Aún no hay viajes registrados</p>
              <p className="mt-1 text-sm text-slate-500">Los nuevos registros aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[28rem] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Lateral</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Planilla</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Conductor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Convenio</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Ruta</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Contacto</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Autorizó</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Usuario</th>
                      {rol === 'administrador' && (
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-[0.12em] text-xs">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {viajes.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {new Date(v.created_at).toLocaleString('es-CO', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{v.codigo_vehiculo}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {v.numero_planilla ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {v.numero_planilla}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Sin planilla</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{v.conductor}</td>
                        <td className="px-4 py-3 text-slate-600">{v.convenio_nombre}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="text-xs">
                            {v.origen} → {v.destino}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                            {formatearMedioContacto(v.medio_contacto)}
                          </span>
                          {v.omite_consecutivo && (
                            <span className="block mt-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              ⚠ Omisión: {v.motivo_omision || 'Sin detalle'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="font-medium text-slate-900">{v.autorizador_operador_nombre || 'N/A'}</span>
                          <span className="block text-xs text-slate-500">CC: {v.cedula_autorizador || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{v.creado_por_usuario}</td>
                        {rol === 'administrador' && (
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarViaje(v)}
                              className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                            >
                              Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {mostrarModalEditarViaje && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Editar viaje registrado</h3>
              <p className="mt-1 text-sm text-slate-600">Disponible solo para administradores.</p>
            </div>

            <form onSubmit={handleGuardarEdicionViaje} className="max-h-[75vh] overflow-auto px-6 py-5">
              {errorEditarViaje && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorEditarViaje}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Lateral *</label>
                  <select
                    value={editVehiculoId}
                    onChange={(e) => {
                      setEditVehiculoId(e.target.value);
                      setEditPlanillaId('');
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione un lateral</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.codigo_vehiculo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Planilla *</label>
                  <select
                    value={editPlanillaId}
                    onChange={(e) => setEditPlanillaId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione una planilla</option>
                    {planillasEditablesDelLateral.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numero_planilla} - {new Date(p.fecha).toLocaleDateString('es-CO')} ({p.estado})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Conductor *</label>
                  <input
                    type="text"
                    value={editConductor}
                    onChange={(e) => setEditConductor(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Convenio *</label>
                  <select
                    value={editConvenioId}
                    onChange={(e) => setEditConvenioId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione convenio</option>
                    {convenios.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Origen *</label>
                  <input
                    type="text"
                    value={editOrigen}
                    onChange={(e) => setEditOrigen(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Destino *</label>
                  <input
                    type="text"
                    value={editDestino}
                    onChange={(e) => setEditDestino(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Medio de contacto *</label>
                  <select
                    value={editMedioContacto}
                    onChange={(e) => setEditMedioContacto(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione</option>
                    <option value="llamada_telefonica">Llamada telefónica</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="mensajeria_app">Mensajería de la aplicación</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Autoriza (operador) *</label>
                  <select
                    value={editAutorizadorId}
                    onChange={(e) => setEditAutorizadorId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione operador</option>
                    {autorizadores.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Cédula del autorizador *</label>
                  <input
                    type="text"
                    value={editCedulaAutorizador}
                    onChange={(e) => setEditCedulaAutorizador(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Código de seguridad *</label>
                  <input
                    type="text"
                    value={editRespuestaAutorizacion}
                    onChange={(e) => setEditRespuestaAutorizacion(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <label className="flex items-start gap-3 text-sm font-medium text-amber-900">
                  <input
                    type="checkbox"
                    checked={editOmiteConsecutivo}
                    onChange={(e) => setEditOmiteConsecutivo(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded"
                  />
                  <span>Omitir regla de consecutivo para este viaje</span>
                </label>

                {editOmiteConsecutivo && (
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-semibold text-amber-900">Justificación de omisión *</label>
                    <textarea
                      value={editMotivoOmision}
                      onChange={(e) => setEditMotivoOmision(e.target.value)}
                      required={editOmiteConsecutivo}
                      rows={2}
                      className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleCerrarEditarViaje}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingEditarViaje}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingEditarViaje ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalConfirmarEdicion && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Confirmar cambios del viaje</h3>
              <p className="mt-1 text-sm text-slate-600">Revise la información antes de guardar.</p>
            </div>
            <div className="space-y-2 px-6 py-5 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">ID:</span> {editViajeId}</p>
              <p><span className="font-semibold text-slate-900">Lateral:</span> {lateralSeleccionadoEdicion?.codigo_vehiculo || editVehiculoId}</p>
              <p><span className="font-semibold text-slate-900">Planilla:</span> {planillaSeleccionadaEdicion?.numero_planilla || editPlanillaId}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setMostrarModalConfirmarEdicion(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGuardarEdicionViaje}
                disabled={loadingEditarViaje}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingEditarViaje ? 'Guardando...' : 'Confirmar y guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalConfirmarEliminacion && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white shadow-2xl">
            <div className="border-b border-red-100 bg-red-50 px-6 py-4">
              <h3 className="text-lg font-bold text-red-900">Confirmar eliminación masiva</h3>
              <p className="mt-1 text-sm text-red-800">Esta acción no se puede deshacer.</p>
            </div>
            <div className="space-y-2 px-6 py-5 text-sm text-slate-700">
              <p>
                Se eliminarán todos los viajes del lateral <span className="font-semibold text-slate-900">{lateralSeleccionadoEliminar?.codigo_vehiculo || lateralEliminarId}</span>.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-red-100 bg-red-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setMostrarModalConfirmarEliminacion(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarViajesPorLateral}
                disabled={loadingEliminarViajes}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingEliminarViajes ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExito && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white shadow-2xl">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-4">
              <h3 className="text-lg font-bold text-emerald-900">{modalExito.titulo}</h3>
            </div>
            <div className="space-y-2 px-6 py-5 text-sm text-slate-700">
              {modalExito.detalle.map((linea) => (
                <p key={linea}>{linea}</p>
              ))}
            </div>
            <div className="flex justify-end border-t border-emerald-100 bg-emerald-50 px-6 py-4">
              <button
                type="button"
                onClick={cerrarModalExitoYRecargar}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalPlanilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Seleccionar planilla del lateral</h3>
              <p className="mt-1 text-sm text-slate-600">Este paso es obligatorio antes de registrar el viaje.</p>
            </div>

            <div className="max-h-[60vh] overflow-auto px-6 py-5">
              {errorPlanilla && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorPlanilla}
                </div>
              )}

              {!vehiculoId && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Seleccione primero un lateral en el formulario para listar sus planillas disponibles.
                </div>
              )}

              {vehiculoId && planillasDelLateral.length === 0 && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">
                    No hay planillas registradas para este lateral. Debe crear una planilla antes de continuar.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalPlanilla(false);
                      setMostrarFormularioPlanilla(true);
                    }}
                    className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Crear planilla aquí
                  </button>
                </div>
              )}

              {vehiculoId && planillasDelLateral.length > 0 && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={planillaBusqueda}
                    onChange={(e) => setPlanillaBusqueda(e.target.value)}
                    className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Buscar por número, estado o fecha"
                  />

                  {planillasDelLateralFiltradas.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      No se encontraron planillas con ese criterio de búsqueda.
                    </div>
                  )}

                  {planillasDelLateralFiltradas.map((planilla) => (
                    <label
                      key={planilla.id}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="planilla_modal"
                        value={planilla.id}
                        checked={planillaSeleccionadaId === String(planilla.id)}
                        onChange={(e) => setPlanillaSeleccionadaId(e.target.value)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">Planilla {planilla.numero_planilla}</p>
                        <p className="text-xs text-slate-600">
                          Lateral {planilla.codigo_vehiculo || 'N/A'} • {new Date(planilla.fecha).toLocaleDateString('es-CO')} • Estado {planilla.estado}
                        </p>
                        {planilla.conductor && <p className="mt-1 text-xs text-slate-500">Conductor: {planilla.conductor}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setMostrarModalPlanilla(false);
                  setMostrarFormularioPlanilla(true);
                }}
                className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Crear nueva planilla
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalPlanilla(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={confirmarPlanillaYRegistrar}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Confirmar y registrar viaje
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarFormularioPlanilla && (
        <div className="fixed inset-0 z-[60] bg-black/50">
          <FormPlanilla
            vehiculos={vehiculos}
            operadores={autorizadores}
            valorDefecto={valorPlanillaDefecto}
            recargarAlGuardar={false}
            vehiculoInicialId={vehiculoId ? parseInt(vehiculoId, 10) : undefined}
            onPlanillaCreada={handlePlanillaCreada}
            onClose={() => {
              setMostrarFormularioPlanilla(false);
              setMostrarModalPlanilla(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
