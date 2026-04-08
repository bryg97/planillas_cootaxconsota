'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth-helper';

type UsuarioRol = {
  id: number;
  usuario: string;
  rol: string;
};

type UltimoViaje = {
  id: number;
  vehiculo_id: number;
  codigo_vehiculo: string;
};

export async function crearConvenio(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: 'Usuario no autenticado' };
    }

    const usuario = await queryOne<UsuarioRol>(
      'SELECT id, usuario, rol FROM usuarios WHERE usuario = $1',
      [session.user.email]
    );

    if (!usuario || usuario.rol !== 'administrador') {
      return { error: 'Solo el administrador puede crear convenios' };
    }

    const nombre = ((formData.get('nombre') as string) || '').trim();
    if (!nombre) {
      return { error: 'El nombre del convenio es obligatorio' };
    }

    const creado = await queryOne<{ id: number; nombre: string }>(
      `INSERT INTO convenios_empresariales (nombre, creado_por_id)
       VALUES ($1, $2)
       RETURNING id, nombre`,
      [nombre, usuario.id]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [usuario.usuario, 'INSERT', `Creó convenio empresarial ${nombre}`]
    );

    revalidatePath('/viajes');
    return { success: true, data: creado };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear convenio';
    return { error: message };
  }
}

export async function crearViaje(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: 'Usuario no autenticado' };
    }

    const usuario = await queryOne<UsuarioRol>(
      'SELECT id, usuario, rol FROM usuarios WHERE usuario = $1',
      [session.user.email]
    );

    if (!usuario || !['administrador', 'supervisor', 'operador'].includes(usuario.rol)) {
      return { error: 'No tiene permisos para registrar viajes' };
    }

    const vehiculoId = parseInt(formData.get('vehiculo_id') as string, 10);
    const conductor = ((formData.get('conductor') as string) || '').trim();
    const convenioId = parseInt(formData.get('convenio_id') as string, 10);
    const origen = ((formData.get('origen') as string) || '').trim();
    const destino = ((formData.get('destino') as string) || '').trim();
    const medioContacto = ((formData.get('medio_contacto') as string) || '').trim();
    const omiteConsecutivo = formData.get('omite_consecutivo') === '1';
    const motivoOmision = ((formData.get('motivo_omision') as string) || '').trim();

    if (!vehiculoId || !conductor || !convenioId || !origen || !destino || !medioContacto) {
      return { error: 'Todos los campos del viaje son obligatorios' };
    }

    if (!['llamada_telefonica', 'whatsapp', 'mensajeria_app'].includes(medioContacto)) {
      return { error: 'Medio de contacto no válido' };
    }

    if (omiteConsecutivo && motivoOmision.length < 10) {
      return { error: 'Debe dejar una justificación clara (mínimo 10 caracteres) para omitir el consecutivo' };
    }

    const ultimoViaje = await queryOne<UltimoViaje>(
      `SELECT vi.id, vi.vehiculo_id, v.codigo_vehiculo
       FROM viajes vi
       INNER JOIN vehiculos v ON v.id = vi.vehiculo_id
       ORDER BY vi.created_at DESC
       LIMIT 1`
    );

    if (ultimoViaje && ultimoViaje.vehiculo_id === vehiculoId && !omiteConsecutivo) {
      return {
        error: `No se puede repetir consecutivamente la unidad ${ultimoViaje.codigo_vehiculo}. Si debe usarla, active la omisión y justifique el motivo.`
      };
    }

    const viaje = await queryOne<{ id: number }>(
      `INSERT INTO viajes (
        vehiculo_id,
        conductor,
        convenio_id,
        origen,
        destino,
        medio_contacto,
        omite_consecutivo,
        motivo_omision,
        creado_por_id,
        creado_por_usuario
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        vehiculoId,
        conductor,
        convenioId,
        origen,
        destino,
        medioContacto,
        omiteConsecutivo,
        omiteConsecutivo ? motivoOmision : null,
        usuario.id,
        usuario.usuario
      ]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [
        usuario.usuario,
        'INSERT',
        `Registró viaje ID ${viaje?.id || 'N/A'} con vehículo ${vehiculoId} (omite consecutivo: ${omiteConsecutivo ? 'sí' : 'no'})`
      ]
    );

    revalidatePath('/viajes');
    return { success: true, data: viaje };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear viaje';
    return { error: message };
  }
}
