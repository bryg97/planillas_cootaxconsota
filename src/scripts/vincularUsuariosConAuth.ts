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

    // 2. Obtener todos los usuarios de Supabase Auth (paginando si hay muchos)
    let allAuthUsers: any[] = [];
    let nextPage = null;
    do {
      const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({ page: nextPage });
      if (authError) {
        console.error('Error al obtener usuarios Auth:', authError.message);
        return;
      }
      allAuthUsers = allAuthUsers.concat(authData.users);
      nextPage = authData.nextPage ?? null;
    } while (nextPage);

    for (const user of usuarios) {
      // Buscar el usuario de Auth por email
      const match = allAuthUsers.find((au) => au.email === user.usuario);
      if (!match) {
        console.warn(`No se encontró usuario Auth para: ${user.usuario}`);
        continue;
      }
      const uuid = match.id;
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
