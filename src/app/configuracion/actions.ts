'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getConfiguracion() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('configuracion')
    .select('*')
    .single();
  
  return data;
}

export async function updateConfiguracion(formData: FormData) {
  const valorPlanillaDefecto = parseFloat(formData.get('valor_planilla_defecto') as string);
  const canalTelegram = formData.get('canal_telegram') as string;
  const botTelegram = formData.get('bot_telegram') as string;

  const adminClient = createAdminClient();
  
  // Siempre actualizar el registro con id=1, si no existe lo crea
  const { data, error } = await adminClient
    .from('configuracion')
    .upsert({
      id: 1,
      valor_planilla_defecto: valorPlanillaDefecto,
      canal_telegram: canalTelegram,
      bot_telegram: botTelegram
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error guardando configuración:', error);
    return { error: error.message };
  }

  revalidatePath('/configuracion');
  return { success: true };
}

export async function createOperador(formData: FormData) {
  const nombre = formData.get('nombre') as string;

  if (!nombre) {
    return { error: 'El nombre es requerido' };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('modulos')
    .insert({
      nombre: nombre,
      descripcion: 'Operador',
      icono: '👤',
      ruta: '/operador',
      activo: true
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/configuracion');
  return { success: true, data };
}

export async function deleteOperador(id: number) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('modulos')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/configuracion');
  return { success: true };
}

export async function depurarVehiculos() {
  const adminClient = createAdminClient();
  
  // Eliminar vehículos sin planillas asociadas
  const { data: vehiculosSinPlanillas, error: errorQuery } = await adminClient
    .from('vehiculos')
    .select(`
      id,
      planillas:planillas(id)
    `);

  if (errorQuery) {
    return { error: errorQuery.message };
  }

  const vehiculosEliminar = vehiculosSinPlanillas
    ?.filter((v: any) => !v.planillas || v.planillas.length === 0)
    .map((v: any) => v.id) || [];

  if (vehiculosEliminar.length > 0) {
    const { error } = await adminClient
      .from('vehiculos')
      .delete()
      .in('id', vehiculosEliminar);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath('/configuracion');
  revalidatePath('/vehiculos');
  return { 
    success: true, 
    message: `Se eliminaron ${vehiculosEliminar.length} vehículos sin planillas` 
  };
}

export async function eliminarPlanillasVehiculo(vehiculoId: number) {
  const adminClient = createAdminClient();
  
  // Eliminar todas las planillas del vehículo
  const { error } = await adminClient
    .from('planillas')
    .delete()
    .eq('vehiculo_id', vehiculoId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/configuracion');
  revalidatePath('/planillas');
  return { 
    success: true, 
    message: 'Todas las planillas del vehículo fueron eliminadas' 
  };
}

export async function eliminarTodasPlanillas() {
  const adminClient = createAdminClient();
  
  // Eliminar TODAS las planillas de TODOS los vehículos
  const { error, count } = await adminClient
    .from('planillas')
    .delete()
    .neq('id', 0); // Condición que siempre es verdadera para eliminar todo

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/configuracion');
  revalidatePath('/planillas');
  return { 
    success: true, 
    message: `Se eliminaron todas las planillas del sistema` 
  };
}
