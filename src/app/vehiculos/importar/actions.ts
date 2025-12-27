'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export async function importarVehiculos(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    return { error: 'No se seleccionó ningún archivo' };
  }

  // Validar tipo de archivo
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return { error: 'Formato de archivo no válido. Use Excel (.xlsx, .xls) o CSV (.csv)' };
  }

  try {
    // Leer el archivo
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return { error: 'El archivo está vacío' };
    }

    // Validar columnas requeridas
    const firstRow = data[0] as any;
    if (!firstRow.codigo_vehiculo) {
      return { error: 'Falta la columna "codigo_vehiculo" en el archivo' };
    }

    // Preparar datos para inserción
    const vehiculos = data.map((row: any) => ({
      codigo_vehiculo: row.codigo_vehiculo?.toString().trim() || '',
      saldo: parseFloat(row.saldo?.toString() || '0') || 0,
      saldo_pendiente: parseFloat(row.saldo_pendiente?.toString() || '0') || 0
    }));

    // Filtrar registros válidos
    const vehiculosValidos = vehiculos.filter(v => v.codigo_vehiculo !== '');

    if (vehiculosValidos.length === 0) {
      return { error: 'No se encontraron vehículos válidos en el archivo' };
    }

    // Insertar en la base de datos
    const adminClient = createAdminClient();
    
    // Insertar en lotes de 100 para evitar timeouts
    const batchSize = 100;
    let insertados = 0;
    let errores = 0;

    for (let i = 0; i < vehiculosValidos.length; i += batchSize) {
      const batch = vehiculosValidos.slice(i, i + batchSize);
      
      const { data: insertData, error } = await adminClient
        .from('vehiculos')
        .insert(batch)
        .select();

      if (error) {
        // Si hay error por duplicados, contar cuántos se insertaron
        if (error.code === '23505') {
          errores += batch.length;
        } else {
          return { error: `Error al insertar: ${error.message}` };
        }
      } else {
        insertados += insertData?.length || 0;
      }
    }

    revalidatePath('/vehiculos');
    
    if (errores > 0) {
      return { 
        success: true, 
        message: `Se importaron ${insertados} vehículos correctamente. ${errores} vehículos ya existían y no se duplicaron.`,
        total: insertados,
        duplicados: errores
      };
    }

    return { 
      success: true, 
      message: `Se importaron ${insertados} vehículos correctamente`,
      total: insertados 
    };

  } catch (error: any) {
    return { error: `Error al procesar el archivo: ${error.message}` };
  }
}
