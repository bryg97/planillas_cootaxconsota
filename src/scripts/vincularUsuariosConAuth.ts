// Script para vincular usuarios existentes en la tabla 'usuarios' con su uuid de Supabase Auth
// Ejecuta este script una sola vez en entorno seguro (ej: script admin en Next.js o Node.js)

import { createAdminClient } from '@/lib/supabase/admin';

async function vincularUsuariosConAuth() {
  const adminClient = createAdminClient();

  // 1. Obtener todos los usuarios de la tabla usuarios que no tengan auth_id
  const { data: usuarios, error } = await adminClient
    .from('usuarios')
    .select('id, usuario, auth_id')
    .is('auth_id', null);

  if (error) {
    console.error('Error al obtener usuarios:', error.message);
    return;
  }

  for (const user of usuarios) {
    // 2. Buscar el usuario en Supabase Auth por email
    const { data: authUser, error: authError } = await adminClient.auth.admin.listUsers({ email: user.usuario });
    if (authError || !authUser || !authUser.users || authUser.users.length === 0) {
      console.warn(`No se encontró usuario Auth para: ${user.usuario}`);
      continue;
    }
    const uuid = authUser.users[0].id;
    // 3. Actualizar la tabla usuarios con el uuid
    const { error: updateError } = await adminClient
      .from('usuarios')
      .update({ auth_id: uuid })
      .eq('id', user.id);
    if (updateError) {
      console.error(`Error actualizando auth_id para ${user.usuario}:`, updateError.message);
    } else {
      console.log(`Vinculado: ${user.usuario} -> ${uuid}`);
    }
  }
}

vincularUsuariosConAuth();
