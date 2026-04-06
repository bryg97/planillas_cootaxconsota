'use server';

import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';

export async function createVehiculo(formData: FormData) {
  const codigoVehiculo = formData.get('codigo_vehiculo') as string;
  const saldo = parseFloat(formData.get('saldo') as string) || 0;
  const saldoPendiente = parseFloat(formData.get('saldo_pendiente') as string) || 0;
  const creditoSinLimite = formData.get('credito_sin_limite') === '1';
  const autorizadoPorNombre = ((formData.get('autorizado_por_nombre') as string) || '').trim();
  const autorizadoPorIdentificacion = ((formData.get('autorizado_por_identificacion') as string) || '').trim();
  const autorizadoDesde = (formData.get('autorizado_desde') as string) || null;
  const autorizadoHasta = (formData.get('autorizado_hasta') as string) || null;

  if (!codigoVehiculo) {
    return { error: 'El código del vehículo es requerido' };
  }

  if (creditoSinLimite) {
    if (!autorizadoPorNombre || !autorizadoPorIdentificacion || !autorizadoDesde) {
      return { error: 'Para crédito sin límite debe registrar nombre, identificación y fecha inicial de autorización' };
    }
  }

  const result = await query(
    `INSERT INTO vehiculos (
      codigo_vehiculo,
      saldo,
      saldo_pendiente,
      credito_sin_limite,
      autorizado_por_nombre,
      autorizado_por_identificacion,
      autorizado_desde,
      autorizado_hasta
    ) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING *`,
    [
      codigoVehiculo,
      saldo,
      saldoPendiente,
      creditoSinLimite,
      creditoSinLimite ? autorizadoPorNombre : null,
      creditoSinLimite ? autorizadoPorIdentificacion : null,
      creditoSinLimite ? autorizadoDesde : null,
      creditoSinLimite ? autorizadoHasta : null
    ]
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
  const creditoSinLimite = formData.get('credito_sin_limite') === '1';
  const autorizadoPorNombre = ((formData.get('autorizado_por_nombre') as string) || '').trim();
  const autorizadoPorIdentificacion = ((formData.get('autorizado_por_identificacion') as string) || '').trim();
  const autorizadoDesde = (formData.get('autorizado_desde') as string) || null;
  const autorizadoHasta = (formData.get('autorizado_hasta') as string) || null;

  if (creditoSinLimite) {
    if (!autorizadoPorNombre || !autorizadoPorIdentificacion || !autorizadoDesde) {
      return { error: 'Para crédito sin límite debe registrar nombre, identificación y fecha inicial de autorización' };
    }
  }

  const result = await query(
    `UPDATE vehiculos 
     SET codigo_vehiculo = $1,
         saldo = $2,
         saldo_pendiente = $3,
         credito_sin_limite = $4,
         autorizado_por_nombre = $5,
         autorizado_por_identificacion = $6,
         autorizado_desde = $7,
         autorizado_hasta = $8
     WHERE id = $9 
     RETURNING *`,
    [
      codigoVehiculo,
      saldo,
      saldoPendiente,
      creditoSinLimite,
      creditoSinLimite ? autorizadoPorNombre : null,
      creditoSinLimite ? autorizadoPorIdentificacion : null,
      creditoSinLimite ? autorizadoDesde : null,
      creditoSinLimite ? autorizadoHasta : null,
      id
    ]
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
