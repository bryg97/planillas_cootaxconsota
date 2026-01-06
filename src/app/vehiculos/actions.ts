'use server';

import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';

export async function createVehiculo(formData: FormData) {
  const codigoVehiculo = formData.get('codigo_vehiculo') as string;
  const saldo = parseFloat(formData.get('saldo') as string) || 0;
  const saldoPendiente = parseFloat(formData.get('saldo_pendiente') as string) || 0;

  if (!codigoVehiculo) {
    return { error: 'El código del vehículo es requerido' };
  }

  const result = await query(
    `INSERT INTO vehiculos (codigo_vehiculo, saldo, saldo_pendiente) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [codigoVehiculo, saldo, saldoPendiente]
  );

  if (!result || result.length === 0) {
    return { error: 'Error al crear vehículo' };
  }

  revalidatePath('/vehiculos');
  return { success: true, data: result[0] };
}

export async function updateVehiculo(id: number, formData: FormData) {
  const codigoVehiculo = formData.get('codigo_vehiculo') as string;
  const saldo = parseFloat(formData.get('saldo') as string) || 0;
  const saldoPendiente = parseFloat(formData.get('saldo_pendiente') as string) || 0;

  const result = await query(
    `UPDATE vehiculos 
     SET codigo_vehiculo = $1, saldo = $2, saldo_pendiente = $3 
     WHERE id = $4 
     RETURNING *`,
    [codigoVehiculo, saldo, saldoPendiente, id]
  );

  if (!result || result.length === 0) {
    return { error: 'Error al actualizar vehículo' };
  }

  revalidatePath('/vehiculos');
  return { success: true, data: result[0] };
}
