
'use server';
import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';
import bcrypt from 'bcryptjs';

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
      `INSERT INTO auditoria (usuario, accion, detalles, tabla, registro_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario, 'UPDATE', `Actualizó usuario ${usuario} (ID: ${id})`, 'usuarios', id]
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
      `INSERT INTO auditoria (usuario, accion, detalles, tabla, registro_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario, 'INSERT', `Creó usuario ${usuario} (ID: ${newId})`, 'usuarios', newId]
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
    // Obtener usuario antes de eliminar para auditoría
    const usuarioRow = await query<{ usuario: string }>(
      'SELECT usuario FROM usuarios WHERE id = $1',
      [id]
    );

    await execute(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );

    // Auditoría: registrar DELETE
    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles, tabla, registro_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioRow?.[0]?.usuario || 'desconocido', 'DELETE', `Eliminó usuario ${usuarioRow?.[0]?.usuario || ''} (ID: ${id})`, 'usuarios', id]
    );

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
    return { error: message, success: false };
  }
}
