import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query, queryOne } from '@/lib/db';
import ViajesClient from './ViajesClient';

type UsuarioRol = { rol: string };

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

type ConfiguracionValorDefecto = {
  valor_planilla_defecto: number;
};

type UltimoViaje = {
  id: number;
  vehiculo_id: number;
  codigo_vehiculo: string;
  created_at: string;
};

type HistorialPorLateral = {
  vehiculo_id: number;
  total: number;
};

export default async function ViajesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const usuario = await queryOne<UsuarioRol>(
    'SELECT rol FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  const rol = usuario?.rol || 'operador';
  if (!['administrador', 'supervisor', 'operador'].includes(rol)) {
    redirect('/dashboard');
  }

  const vehiculos = await query<Vehiculo>(
    'SELECT id, codigo_vehiculo FROM vehiculos ORDER BY codigo_vehiculo ASC'
  );

  const convenios = await query<Convenio>(
    'SELECT id, nombre FROM convenios_empresariales WHERE activo = true ORDER BY nombre ASC'
  );

  const autorizadores = await query<OperadorRegistrado>(
    'SELECT id, nombre FROM modulos WHERE descripcion = $1 ORDER BY nombre ASC',
    ['Operador']
  );

  const validacionesAutorizador = await query<ValidacionAutorizador>(
    `SELECT
      v.operador_id,
      v.operador_nombre,
      v.cedula,
      v.respuesta
    FROM viajes_autorizadores_validacion v
    WHERE v.activo = true
    ORDER BY v.operador_nombre ASC`
  );

  const ultimoViaje = await queryOne<UltimoViaje>(
    `SELECT vi.id, vi.vehiculo_id, v.codigo_vehiculo, vi.created_at
     FROM viajes vi
     INNER JOIN vehiculos v ON v.id = vi.vehiculo_id
     ORDER BY vi.created_at DESC
     LIMIT 1`
  );

  const viajes = await query<ViajeListado>(
    `SELECT
      vi.id,
      vi.created_at,
      vi.planilla_id,
      vi.vehiculo_id,
      vi.convenio_id,
      vi.conductor,
      vi.origen,
      vi.destino,
      vi.medio_contacto,
      vi.omite_consecutivo,
      vi.motivo_omision,
      v.codigo_vehiculo,
      ce.nombre AS convenio_nombre,
      vi.creado_por_usuario,
      vi.autorizador_operador_id,
      vi.autorizador_operador_nombre,
      vi.cedula_autorizador,
      vi.respuesta_autorizacion,
      p.numero_planilla
    FROM viajes vi
    INNER JOIN vehiculos v ON v.id = vi.vehiculo_id
    INNER JOIN convenios_empresariales ce ON ce.id = vi.convenio_id
    LEFT JOIN planillas p ON p.id = vi.planilla_id
    ORDER BY vi.created_at DESC
    LIMIT 100`
  );

  const planillasDisponibles = await query<PlanillaDisponible>(
    `SELECT
      p.id,
      p.numero_planilla,
      p.vehiculo_id,
      v.codigo_vehiculo,
      p.fecha,
      p.estado,
      p.conductor
    FROM planillas p
    LEFT JOIN vehiculos v ON v.id = p.vehiculo_id
    WHERE p.numero_planilla IS NOT NULL
      AND p.vehiculo_id IS NOT NULL
    ORDER BY p.fecha DESC, p.created_at DESC
    `
  );

  const historialPorLateralRows = await query<HistorialPorLateral>(
    `SELECT vehiculo_id, COUNT(1)::int AS total
     FROM viajes
     GROUP BY vehiculo_id`
  );

  const historialPorLateral = historialPorLateralRows.reduce<Record<string, number>>((acc, row) => {
    acc[String(row.vehiculo_id)] = Number(row.total || 0);
    return acc;
  }, {});

  const configuracion = await query<ConfiguracionValorDefecto>(
    'SELECT valor_planilla_defecto FROM configuracion LIMIT 1'
  );

  return (
    <ViajesClient
      rol={rol}
      vehiculos={vehiculos}
      convenios={convenios}
      autorizadores={autorizadores}
      validacionesAutorizador={validacionesAutorizador}
      ultimoViaje={ultimoViaje}
      viajes={viajes}
      historialPorLateral={historialPorLateral}
      planillasDisponibles={planillasDisponibles}
      valorPlanillaDefecto={configuracion[0]?.valor_planilla_defecto || 0}
    />
  );
}
