
'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function editarUsuario(id: number | undefined, formData: FormData) {
  if (!id) return { error: 'ID de usuario requerido' };
  const usuario = formData.get('usuario') as string;
  const clave = formData.get('clave') as string;
  const rol = formData.get('rol') as string;

  if (!usuario || !rol) {
    return { error: 'Usuario y rol son requeridos' };
  }

  const adminClient = createAdminClient();
  let updateData: any = {
    rol: rol
  };
  let updateAuth = false;
  let authError = null;
  // Solo actualizar clave si se provee
  if (clave && clave.length >= 6) {
    updateData.clave = await bcrypt.hash(clave, 10);
    updateAuth = true;
  }

  // Buscar el usuario en la tabla usuarios para obtener el uuid de auth
  const { data: usuarioRow, error: findError } = await adminClient
    .from('usuarios')
    .select('id, usuario, auth_id')
    .eq('id', id)
    .single();
  if (findError || !usuarioRow) {
    return { error: 'No se encontró el usuario en la base de datos' };
  }

  // Si hay que actualizar auth, hacerlo en auth.users (si hay auth_id)
  if (updateAuth) {
    if (usuarioRow.auth_id) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        usuarioRow.auth_id,
        { password: clave }
      );
      if (authUpdateError) {
        authError = authUpdateError.message;
      }
    } else {
      authError = 'No se pudo sincronizar con Auth porque el usuario no tiene auth_id.';
    }
  }

  const { error } = await adminClient
    .from('usuarios')
    .update(updateData)
    .eq('id', id);

  // Auditoría: registrar UPDATE
  await adminClient.from('auditoria').insert({
    usuario: usuario,
    accion: 'UPDATE',
    detalles: `Actualizó usuario ${usuario} (ID: ${id})`,
    created_at: new Date().toISOString(),
    tabla: 'usuarios',
    registro_id: id
  });

  if (error) {
    return { error: error.message };
  }
  if (authError) {
    return { error: 'Usuario actualizado, pero error en auth: ' + authError };
  }

  revalidatePath('/usuarios');
  return { success: true };
}

export async function createUsuario(formData: FormData) {
  const usuario = formData.get('usuario') as string;
  const clave = formData.get('clave') as string;
  const rol = formData.get('rol') as string;

  if (!usuario || !clave || !rol) {
    return { error: 'Todos los campos son requeridos' };
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(clave, 10);

  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('usuarios')
    .insert({
      usuario: usuario,
      clave: hashedPassword,
      rol: rol
    })
    .select()
    .single();

  // Auditoría: registrar INSERT
  if (data && data.id) {
    await adminClient.from('auditoria').insert({
      usuario: usuario,
      accion: 'INSERT',
      detalles: `Creó usuario ${usuario} (ID: ${data.id})`,
      created_at: new Date().toISOString(),
      tabla: 'usuarios',
      registro_id: data.id
    });
  }

  if (error) {
    if (error.code === '23505') { // Duplicate key
      return { error: 'El usuario ya existe' };
    }
    return { error: error.message };
  }

  revalidatePath('/usuarios');
  return { success: true, data };
}

export async function deleteUsuario(id: number) {
  const adminClient = createAdminClient();

  // Obtener usuario antes de eliminar para auditoría
  const { data: usuarioRow } = await adminClient
    .from('usuarios')
    .select('usuario')
    .eq('id', id)
    .single();

  const { error } = await adminClient
    .from('usuarios')
    .delete()
    .eq('id', id);

  // Auditoría: registrar DELETE
  await adminClient.from('auditoria').insert({
    usuario: usuarioRow?.usuario || 'desconocido',
    accion: 'DELETE',
    detalles: `Eliminó usuario ${usuarioRow?.usuario || ''} (ID: ${id})`,
    created_at: new Date().toISOString(),
    tabla: 'usuarios',
    registro_id: id
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/usuarios');
  return { success: true };
}
