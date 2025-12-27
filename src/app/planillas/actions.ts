'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createPlanilla(formData: FormData) {
  const vehiculoId = parseInt(formData.get('vehiculo_id') as string);
  const conductor = formData.get('conductor') as string;
  const tipo = formData.get('tipo') as string;
  const valor = parseFloat(formData.get('valor') as string);
  const numeroPlanilla = formData.get('numero_planilla') as string;
  const fecha = formData.get('fecha') as string;

  if (!vehiculoId || !conductor || !valor || !numeroPlanilla || !fecha) {
    return { error: 'Todos los campos son requeridos' };
  }

  // Obtener el usuario actual
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  // Obtener el ID del operador desde la tabla usuarios
  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('usuarios')
    .select('id')
    .eq('usuario', user.email)
    .single();

  if (!userData) {
    return { error: 'Usuario no encontrado' };
  }

  const { data, error } = await adminClient
    .from('planillas')
    .insert({
      vehiculo_id: vehiculoId,
      conductor: conductor,
      tipo: tipo,
      valor: valor,
      numero_planilla: numeroPlanilla,
      fecha: fecha,
      operador_id: userData.id,
      pagada: 0
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/planillas');
  revalidatePath('/operaciones');
  return { success: true, data };
}
