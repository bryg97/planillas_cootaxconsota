'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

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
