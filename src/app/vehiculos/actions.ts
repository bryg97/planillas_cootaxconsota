'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createVehiculo(formData: FormData) {
  const codigoVehiculo = formData.get('codigo_vehiculo') as string;
  const saldo = parseFloat(formData.get('saldo') as string) || 0;
  const saldoPendiente = parseFloat(formData.get('saldo_pendiente') as string) || 0;

  if (!codigoVehiculo) {
    return { error: 'El código del vehículo es requerido' };
  }

  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('vehiculos')
    .insert({
      codigo_vehiculo: codigoVehiculo,
      saldo: saldo,
      saldo_pendiente: saldoPendiente
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/vehiculos');
  return { success: true, data };
}

export async function updateVehiculo(id: number, formData: FormData) {
  const codigoVehiculo = formData.get('codigo_vehiculo') as string;
  const saldo = parseFloat(formData.get('saldo') as string) || 0;
  const saldoPendiente = parseFloat(formData.get('saldo_pendiente') as string) || 0;

  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('vehiculos')
    .update({
      codigo_vehiculo: codigoVehiculo,
      saldo: saldo,
      saldo_pendiente: saldoPendiente
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/vehiculos');
  return { success: true, data };
}
