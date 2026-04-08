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

type UsuarioSimple = {
  id: number;
  usuario: string;
};

type ValidacionAutorizador = {
  autorizador_id: number;
  autorizador_usuario: string;
  cedula: string;
  respuesta: string;
};

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
  autorizador_usuario: string | null;
  cedula_autorizador: string | null;
};

type UltimoViaje = {
  id: number;
  vehiculo_id: number;
  codigo_vehiculo: string;
  created_at: string;
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

  const autorizadores = await query<UsuarioSimple>(
    'SELECT id, usuario FROM usuarios ORDER BY usuario ASC'
  );

  const validacionesAutorizador = await query<ValidacionAutorizador>(
    `SELECT
      v.autorizador_id,
      u.usuario AS autorizador_usuario,
      v.cedula,
      v.respuesta
    FROM viajes_autorizadores_validacion v
    INNER JOIN usuarios u ON u.id = v.autorizador_id
    WHERE v.activo = true
    ORDER BY u.usuario ASC`
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
      vi.conductor,
      vi.origen,
      vi.destino,
      vi.medio_contacto,
      vi.omite_consecutivo,
      vi.motivo_omision,
      v.codigo_vehiculo,
      ce.nombre AS convenio_nombre,
      vi.creado_por_usuario,
      vi.autorizador_usuario,
      vi.cedula_autorizador
    FROM viajes vi
    INNER JOIN vehiculos v ON v.id = vi.vehiculo_id
    INNER JOIN convenios_empresariales ce ON ce.id = vi.convenio_id
    ORDER BY vi.created_at DESC
    LIMIT 100`
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
    />
  );
}
