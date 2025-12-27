'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { notificarNuevaPlanillaCredito } from '@/lib/telegram';

export async function verificarDeudaVehiculo(vehiculoId: number) {
  const adminClient = createAdminClient();
  
  const { data: planillas } = await adminClient
    .from('planillas')
    .select('id, numero_planilla, valor, fecha, conductor')
    .eq('vehiculo_id', vehiculoId)
    .eq('tipo_pago', 'credito')
    .eq('estado', 'pendiente')
    .order('fecha', { ascending: true });

  if (!planillas || planillas.length === 0) {
    return null;
  }

  const total = planillas.reduce((sum, p) => sum + (p.valor || 0), 0);

  return {
    planillas: planillas,
    cantidad: planillas.length,
    total: total
  };
}

export async function createPlanilla(formData: FormData) {
  const vehiculoId = parseInt(formData.get('vehiculo_id') as string);
  const conductor = formData.get('conductor') as string;
  const operadorNombre = formData.get('operador') as string;
  const valor = parseFloat(formData.get('valor') as string);
  const numeroPlanilla = formData.get('numero_planilla') as string;
  const fecha = formData.get('fecha') as string;
  const tipoPago = formData.get('tipo_pago') as string;
  const origen = formData.get('origen') as string;
  const destino = formData.get('destino') as string;

  if (!vehiculoId || !conductor || !valor || !numeroPlanilla || !fecha || !tipoPago || !operadorNombre) {
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

  // Obtener datos del vehículo
  const { data: vehiculo } = await adminClient
    .from('vehiculos')
    .select('codigo_vehiculo')
    .eq('id', vehiculoId)
    .single();

  const { data, error } = await adminClient
    .from('planillas')
    .insert({
      vehiculo_id: vehiculoId,
      conductor: conductor,
      operador: operadorNombre,
      valor: valor,
      numero_planilla: numeroPlanilla,
      fecha: fecha,
      operador_id: userData.id,
      pagada: 0,
      tipo_pago: tipoPago,
      estado: 'pendiente',
      origen: origen || null,
      destino: destino || null
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Enviar notificación Telegram solo si es crédito
  if (tipoPago === 'credito') {
    // Usar la fecha/hora actual del sistema para la notificación
    const fechaFormateada = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    await notificarNuevaPlanillaCredito({
      operador: operadorNombre,
      vehiculo: vehiculo?.codigo_vehiculo || '',
      conductor: conductor,
      numero_planilla: numeroPlanilla,
      fecha: fechaFormateada
    });
  }

  revalidatePath('/planillas');
  revalidatePath('/operaciones');
  return { success: true, data };
}

export async function updatePlanilla(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const vehiculoId = parseInt(formData.get('vehiculo_id') as string);
  const conductor = formData.get('conductor') as string;
  const operadorNombre = formData.get('operador') as string;
  const valor = parseFloat(formData.get('valor') as string);
  const numeroPlanilla = formData.get('numero_planilla') as string;
  const fecha = formData.get('fecha') as string;
  const tipoPago = formData.get('tipo_pago') as string;
  const estado = formData.get('estado') as string;
  const origen = formData.get('origen') as string;
  const destino = formData.get('destino') as string;

  if (!id || !vehiculoId || !conductor || !valor || !numeroPlanilla || !fecha || !tipoPago || !operadorNombre || !estado) {
    return { error: 'Todos los campos son requeridos' };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('planillas')
    .update({
      vehiculo_id: vehiculoId,
      conductor: conductor,
      operador: operadorNombre,
      valor: valor,
      numero_planilla: numeroPlanilla,
      fecha: fecha,
      tipo_pago: tipoPago,
      estado: estado,
      origen: origen || null,
      destino: destino || null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/planillas');
  revalidatePath('/operaciones');
  revalidatePath('/historico');
  return { success: true, data };
}
