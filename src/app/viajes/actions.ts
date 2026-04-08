'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth-helper';
import { notificarNuevoViaje } from '@/lib/telegram';

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

type UsuarioSimple = {
  id: number;
  usuario: string;
};

type OperadorRegistrado = {
  id: number;
  nombre: string;
};

export async function eliminarConvenio(convenioId: number) {
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
      return { error: 'Solo el administrador puede eliminar convenios' };
    }

    const convenio = await queryOne<{ nombre: string }>(
      'SELECT nombre FROM convenios_empresariales WHERE id = $1',
      [convenioId]
    );

    if (!convenio) {
      return { error: 'Convenio no encontrado' };
    }

    await execute(
      'UPDATE convenios_empresariales SET activo = false WHERE id = $1',
      [convenioId]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [usuario.usuario, 'UPDATE', `Inactivó convenio empresarial ${convenio.nombre}`]
    );

    revalidatePath('/viajes');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar convenio';
    return { error: message };
  }
}

export async function guardarValidacionAutorizador(formData: FormData) {
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
      return { error: 'Solo el administrador puede configurar validaciones' };
    }

    const operadorId = parseInt(formData.get('operador_id') as string, 10);
    const cedula = ((formData.get('cedula') as string) || '').trim();
    const respuesta = ((formData.get('respuesta') as string) || '').trim();

    if (!operadorId || !cedula || !respuesta) {
      return { error: 'Operador, cédula y respuesta son obligatorios' };
    }

    const operador = await queryOne<OperadorRegistrado>(
      'SELECT id, nombre FROM modulos WHERE descripcion = $1 AND id = $2',
      ['Operador', operadorId]
    );

    if (!operador) {
      return { error: 'Operador no encontrado' };
    }

    await execute(
      `INSERT INTO viajes_autorizadores_validacion (
        operador_id,
        operador_nombre,
        cedula,
        respuesta,
        activo,
        actualizado_por_id,
        updated_at
      ) VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (operador_id)
      DO UPDATE SET
        operador_nombre = EXCLUDED.operador_nombre,
        cedula = EXCLUDED.cedula,
        respuesta = EXCLUDED.respuesta,
        activo = true,
        actualizado_por_id = EXCLUDED.actualizado_por_id,
        updated_at = CURRENT_TIMESTAMP`,
      [operadorId, operador.nombre, cedula, respuesta, usuario.id]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [usuario.usuario, 'UPDATE', `Configuró validación de autorización para operador ${operador.nombre}`]
    );

    revalidatePath('/viajes');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar validación';
    return { error: message };
  }
}

export async function eliminarValidacionAutorizador(operadorId: number) {
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
      return { error: 'Solo el administrador puede eliminar validaciones' };
    }

    const validacion = await queryOne<{ operador_nombre: string }>(
      'SELECT operador_nombre FROM viajes_autorizadores_validacion WHERE operador_id = $1 AND activo = true',
      [operadorId]
    );

    if (!validacion) {
      return { error: 'Validación no encontrada' };
    }

    await execute(
      'UPDATE viajes_autorizadores_validacion SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE operador_id = $1',
      [operadorId]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [
        usuario.usuario,
        'UPDATE',
        `Eliminó validación de autorización para operador ${validacion.operador_nombre}`
      ]
    );

    revalidatePath('/viajes');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar validación';
    return { error: message };
  }
}

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
    const autorizadorOperadorId = parseInt(formData.get('autorizador_operador_id') as string, 10);
    const cedulaAutorizador = ((formData.get('cedula_autorizador') as string) || '').trim();
    const respuestaAutorizacion = ((formData.get('respuesta_autorizacion') as string) || '').trim();
    const omiteConsecutivo = formData.get('omite_consecutivo') === '1';
    const motivoOmision = ((formData.get('motivo_omision') as string) || '').trim();

    if (!vehiculoId || !conductor || !convenioId || !origen || !destino || !medioContacto || !autorizadorOperadorId || !cedulaAutorizador || !respuestaAutorizacion) {
      return { error: 'Todos los campos del viaje son obligatorios' };
    }

    if (!['llamada_telefonica', 'whatsapp', 'mensajeria_app'].includes(medioContacto)) {
      return { error: 'Medio de contacto no válido' };
    }

    if (omiteConsecutivo && motivoOmision.length < 10) {
      return { error: 'Debe dejar una justificación clara (mínimo 10 caracteres) para omitir el consecutivo' };
    }

    const autorizador = await queryOne<OperadorRegistrado>(
      'SELECT id, nombre FROM modulos WHERE descripcion = $1 AND id = $2',
      ['Operador', autorizadorOperadorId]
    );

    if (!autorizador) {
      return { error: 'El operador que autoriza no existe' };
    }

    const validacion = await queryOne<{ id: number }>(
      `SELECT id
       FROM viajes_autorizadores_validacion
       WHERE operador_id = $1
         AND cedula = $2
         AND LOWER(respuesta) = LOWER($3)
         AND activo = true`,
      [autorizadorOperadorId, cedulaAutorizador, respuestaAutorizacion]
    );

    if (!validacion) {
      return { error: 'La validación de autorización no coincide. Verifique operador, cédula y respuesta.' };
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
        error: `No se puede repetir consecutivamente el lateral ${ultimoViaje.codigo_vehiculo}. Si debe usarlo, active la omisión y justifique el motivo.`
      };
    }

    const lateral = await queryOne<{ codigo_vehiculo: string }>(
      'SELECT codigo_vehiculo FROM vehiculos WHERE id = $1',
      [vehiculoId]
    );

    const convenio = await queryOne<{ nombre: string }>(
      'SELECT nombre FROM convenios_empresariales WHERE id = $1',
      [convenioId]
    );

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
        creado_por_usuario,
        autorizador_operador_id,
        autorizador_operador_nombre,
        cedula_autorizador,
        respuesta_autorizacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        usuario.usuario,
        autorizadorOperadorId,
        autorizador.nombre,
        cedulaAutorizador,
        respuestaAutorizacion
      ]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [
        usuario.usuario,
        'INSERT',
        `Registró viaje ID ${viaje?.id || 'N/A'} con lateral ${lateral?.codigo_vehiculo || vehiculoId} (omite consecutivo: ${omiteConsecutivo ? 'sí' : 'no'})`
      ]
    );

    const fecha = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    await notificarNuevoViaje({
      operador: usuario.usuario,
      lateral: lateral?.codigo_vehiculo || String(vehiculoId),
      conductor,
      convenio: convenio?.nombre || String(convenioId),
      origen,
      destino,
      medioContacto,
      autorizador: autorizador.nombre,
      fecha,
      omiteConsecutivo,
      motivoOmision: omiteConsecutivo ? motivoOmision : null
    });

    revalidatePath('/viajes');
    return { success: true, data: viaje };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear viaje';
    return { error: message };
  }
}
