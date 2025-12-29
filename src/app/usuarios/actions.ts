
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

  // Si hay que actualizar auth, hacerlo en auth.users
  if (updateAuth && usuarioRow.auth_id) {
    const { error: authUpdateError } = await adminClient.auth.admin.updateUser(
      usuarioRow.auth_id,
      { password: clave }
    );
    if (authUpdateError) {
      authError = authUpdateError.message;
    }
  }

  const { error } = await adminClient
    .from('usuarios')
    .update(updateData)
    .eq('id', id);

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
  
  const { error } = await adminClient
    .from('usuarios')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/usuarios');
  return { success: true };
}
