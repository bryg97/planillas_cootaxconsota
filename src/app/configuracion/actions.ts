'use server';

import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';

export async function updateOperador(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string);
    const nombre = formData.get('nombre') as string;
    const correo = formData.get('correo') as string;
    if (!id || !nombre || !correo) {
      return { error: 'Todos los campos son requeridos', success: false };
    }
    
    await execute(
      'UPDATE modulos SET nombre = $1, correo = $2 WHERE id = $3',
      [nombre, correo, id]
    );
    
    revalidatePath('/configuracion');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar operador', success: false };
  }
}

export async function getConfiguracion() {
  const result = await query(
    'SELECT * FROM configuracion WHERE id = 1'
  );
  
  return result?.[0];
}

export async function updateConfiguracion(formData: FormData) {
  const valorPlanillaDefecto = parseFloat(formData.get('valor_planilla_defecto') as string);
  const canalTelegram = formData.get('canal_telegram') as string;
  const botTelegram = formData.get('bot_telegram') as string;

  try {
    // Siempre actualizar el registro con id=1, si no existe lo crea
    const exists = await query('SELECT id FROM configuracion WHERE id = 1');
    
    if (exists && exists.length > 0) {
      await execute(
        `UPDATE configuracion SET valor_planilla_defecto = $1, canal_telegram = $2, bot_telegram = $3 WHERE id = 1`,
        [valorPlanillaDefecto, canalTelegram, botTelegram]
      );
    } else {
      await execute(
        `INSERT INTO configuracion (id, valor_planilla_defecto, canal_telegram, bot_telegram) VALUES (1, $1, $2, $3)`,
        [valorPlanillaDefecto, canalTelegram, botTelegram]
      );
    }

    revalidatePath('/configuracion');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar configuración', success: false };
  }
}

export async function createOperador(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string;

    if (!nombre) {
      return { error: 'El nombre es requerido', success: false };
    }

    const result = await query(
      `INSERT INTO modulos (nombre, descripcion, icono, ruta, activo) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nombre, 'Operador', '👤', '/operador', true]
    );

    revalidatePath('/configuracion');
    return { success: true, data: result?.[0] };
  } catch (error: any) {
    return { error: error.message || 'Error al crear operador', success: false };
  }
}

export async function deleteOperador(id: number) {
  try {
    await execute(
      'DELETE FROM modulos WHERE id = $1',
      [id]
    );

    revalidatePath('/configuracion');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar operador', success: false };
  }
}

export async function depurarVehiculos() {
  try {
    // Obtener vehículos sin planillas asociadas
    const vehiculosSinPlanillas = await query(`
      SELECT v.id
      FROM vehiculos v
      LEFT JOIN planillas p ON v.id = p.vehiculo_id
      WHERE p.id IS NULL
      GROUP BY v.id
    `);

    const vehiculosEliminar = vehiculosSinPlanillas?.map((v: any) => v.id) || [];

    if (vehiculosEliminar.length > 0) {
      await execute(
        'DELETE FROM vehiculos WHERE id = ANY($1::int[])',
        [vehiculosEliminar]
      );
    }

    revalidatePath('/configuracion');
    revalidatePath('/vehiculos');
    return { 
      success: true, 
      message: `Se eliminaron ${vehiculosEliminar.length} vehículos sin planillas` 
    };
  } catch (error: any) {
    return { error: error.message || 'Error al depurar vehículos', success: false };
  }
}

export async function eliminarPlanillasVehiculo(vehiculoId: number) {
  try {
    // Eliminar todas las planillas del vehículo
    await execute(
      'DELETE FROM planillas WHERE vehiculo_id = $1',
      [vehiculoId]
    );

    revalidatePath('/configuracion');
    revalidatePath('/planillas');
    return { 
      success: true, 
      message: 'Todas las planillas del vehículo fueron eliminadas' 
    };
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar planillas', success: false };
  }
}

export async function eliminarTodasPlanillas() {
  try {
    // Eliminar TODAS las planillas de TODOS los vehículos
    await execute(
      'DELETE FROM planillas WHERE id > 0',
      []
    );

    revalidatePath('/configuracion');
    revalidatePath('/planillas');
    return { 
      success: true, 
      message: `Se eliminaron todas las planillas del sistema` 
    };
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar planillas', success: false };
  }
}
