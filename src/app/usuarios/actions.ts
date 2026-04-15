
'use server';
import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function hasActivoColumn() {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
        AND column_name = 'activo'
    ) AS exists`
  );

  return Boolean(result?.[0]?.exists);
}

export async function editarUsuario(id: number | undefined, formData: FormData) {
  try {
    if (!id) return { error: 'ID de usuario requerido', success: false };
    const usuario = formData.get('usuario') as string;
    const clave = formData.get('clave') as string;
    const rol = formData.get('rol') as string;

    if (!usuario || !rol) {
      return { error: 'Usuario y rol son requeridos', success: false };
    }

    let updateData: {
      rol: string;
      clave?: string;
    } = {
      rol: rol
    };
    
    // Solo actualizar clave si se provee
    if (clave && clave.length >= 6) {
      updateData.clave = await bcrypt.hash(clave, 10);
    }

    // Buscar el usuario en la tabla usuarios
    const usuarioRow = await query<{ id: number; usuario: string }>(
      'SELECT id, usuario FROM usuarios WHERE id = $1',
      [id]
    );

    if (!usuarioRow || usuarioRow.length === 0) {
      return { error: 'No se encontró el usuario en la base de datos', success: false };
    }

    // Actualizar usuario
    await execute(
      'UPDATE usuarios SET rol = $1 WHERE id = $2',
      [rol, id]
    );

    // Si hay contraseña nueva, actualizar también
    if (clave && clave.length >= 6) {
      const hashedPassword = await bcrypt.hash(clave, 10);
      await execute(
        'UPDATE usuarios SET clave = $1 WHERE id = $2',
        [hashedPassword, id]
      );
    }

    // Auditoría: registrar UPDATE
    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles) 
       VALUES ($1, $2, $3)`,
      [usuario, 'UPDATE', `Actualizó usuario ${usuario} (ID: ${id}) en tabla usuarios`]
    );

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al editar usuario';
    return { error: message, success: false };
  }
}

export async function createUsuario(formData: FormData) {
  try {
    const usuario = formData.get('usuario') as string;
    const clave = formData.get('clave') as string;
    const rol = formData.get('rol') as string;

    if (!usuario || !clave || !rol) {
      return { error: 'Todos los campos son requeridos', success: false };
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(clave, 10);

    const result = await query<{ id: number }>(
      `INSERT INTO usuarios (usuario, clave, rol) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [usuario, hashedPassword, rol]
    );

    if (!result || result.length === 0) {
      return { error: 'Error al crear usuario', success: false };
    }

    const newId = result[0].id;

    // Auditoría: registrar INSERT
    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles) 
       VALUES ($1, $2, $3)`,
      [usuario, 'INSERT', `Creó usuario ${usuario} (ID: ${newId}) en tabla usuarios`]
    );

    revalidatePath('/usuarios');
    return { success: true, data: result[0] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear usuario';
    return { error: message, success: false };
  }
}

export async function deleteUsuario(id: number) {
  try {
    const activoColumnExists = await hasActivoColumn();
    if (!activoColumnExists) {
      return {
        error: 'Falta la columna usuarios.activo. Ejecuta la migracion neon-add-usuarios-activo.sql',
        success: false
      };
    }

    // Obtener usuario antes de actualizar para auditoria
    const usuarioRow = await query<{ usuario: string; activo: boolean }>(
      'SELECT usuario, activo FROM usuarios WHERE id = $1',
      [id]
    );

    if (!usuarioRow || usuarioRow.length === 0) {
      return { error: 'Usuario no encontrado', success: false };
    }

    if (!usuarioRow[0].activo) {
      return { success: true };
    }

    await execute(
      'UPDATE usuarios SET activo = false WHERE id = $1',
      [id]
    );

    // Auditoria: registrar inhabilitacion
    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles) 
       VALUES ($1, $2, $3)`,
      [
        usuarioRow[0].usuario || 'desconocido',
        'DISABLE',
        `Inhabilito usuario ${usuarioRow[0].usuario || ''} (ID: ${id}) en tabla usuarios`
      ]
    );

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
    return { error: message, success: false };
  }
}

export async function toggleUsuarioActivo(id: number, activo: boolean) {
  try {
    const activoColumnExists = await hasActivoColumn();
    if (!activoColumnExists) {
      return {
        error: 'Falta la columna usuarios.activo. Ejecuta la migracion neon-add-usuarios-activo.sql',
        success: false
      };
    }

    const usuarioRow = await query<{ usuario: string; activo: boolean }>(
      'SELECT usuario, activo FROM usuarios WHERE id = $1',
      [id]
    );

    if (!usuarioRow || usuarioRow.length === 0) {
      return { error: 'Usuario no encontrado', success: false };
    }

    if (usuarioRow[0].activo === activo) {
      return { success: true };
    }

    await execute(
      'UPDATE usuarios SET activo = $1 WHERE id = $2',
      [activo, id]
    );

    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [
        usuarioRow[0].usuario || 'desconocido',
        activo ? 'ENABLE' : 'DISABLE',
        `${activo ? 'Rehabilito' : 'Inhabilito'} usuario ${usuarioRow[0].usuario || ''} (ID: ${id}) en tabla usuarios`
      ]
    );

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar estado de usuario';
    return { error: message, success: false };
  }
}
