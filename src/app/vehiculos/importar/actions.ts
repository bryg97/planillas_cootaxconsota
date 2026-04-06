'use server';

import { revalidatePath } from 'next/cache';
import { execute } from '@/lib/db';
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
      saldo_pendiente: parseFloat(row.saldo_pendiente?.toString() || '0') || 0,
      credito_sin_limite: String(row.credito_sin_limite || '').toLowerCase() === 'true' || String(row.credito_sin_limite || '') === '1',
      autorizado_por_nombre: row.autorizado_por_nombre?.toString().trim() || null,
      autorizado_por_identificacion: row.autorizado_por_identificacion?.toString().trim() || null,
      autorizado_desde: row.autorizado_desde?.toString().trim() || null,
      autorizado_hasta: row.autorizado_hasta?.toString().trim() || null
    }));

    // Filtrar registros válidos
    const vehiculosValidos = vehiculos.filter((v: { codigo_vehiculo: string }) => v.codigo_vehiculo !== '');

    if (vehiculosValidos.length === 0) {
      return { error: 'No se encontraron vehículos válidos en el archivo' };
    }

    // Insertar en la base de datos
    let insertados = 0;
    let errores = 0;

    for (const vehiculo of vehiculosValidos) {
      try {
        await execute(
          `INSERT INTO vehiculos (
            codigo_vehiculo,
            saldo,
            saldo_pendiente,
            credito_sin_limite,
            autorizado_por_nombre,
            autorizado_por_identificacion,
            autorizado_desde,
            autorizado_hasta
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            vehiculo.codigo_vehiculo,
            vehiculo.saldo,
            vehiculo.saldo_pendiente,
            vehiculo.credito_sin_limite,
            vehiculo.credito_sin_limite ? vehiculo.autorizado_por_nombre : null,
            vehiculo.credito_sin_limite ? vehiculo.autorizado_por_identificacion : null,
            vehiculo.credito_sin_limite ? vehiculo.autorizado_desde : null,
            vehiculo.credito_sin_limite ? vehiculo.autorizado_hasta : null
          ]
        );
        insertados++;
      } catch (error: any) {
        // Si hay error por duplicados o constraint, contar como error
        if (error.message && error.message.includes('duplicate') || error.message.includes('unique')) {
          errores++;
        } else {
          return { error: `Error al insertar: ${error.message}` };
        }
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
