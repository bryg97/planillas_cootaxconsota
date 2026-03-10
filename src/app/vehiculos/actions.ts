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

export async function deleteVehiculo(id: number) {
  try {
    // Verificar si el vehículo tiene planillas asociadas
    const planillas = await query(
      'SELECT id FROM planillas WHERE vehiculo_id = $1 LIMIT 1',
      [id]
    );

    if (planillas && planillas.length > 0) {
      return { error: 'No se puede eliminar el vehículo porque tiene planillas asociadas. Elimine primero las planillas.' };
    }

    // Eliminar el vehículo
    await execute(
      'DELETE FROM vehiculos WHERE id = $1',
      [id]
    );

    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    return { error: 'Error al eliminar vehículo' };
  }
}
