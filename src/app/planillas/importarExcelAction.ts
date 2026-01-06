import { execute, query } from '@/lib/db';

type VehiculoRow = {
  id: number;
  codigo_vehiculo: string;
};

export async function importarPlanillasDesdeExcel(planillas: any[]) {
  // Obtener todos los vehículos para mapear codigo_vehiculo -> id
  const vehiculos = await query<VehiculoRow>('SELECT id, codigo_vehiculo FROM vehiculos');
  const vehiculoMap = new Map<string, number>();
  vehiculos.forEach(v => {
    vehiculoMap.set(v.codigo_vehiculo.toString().trim().toUpperCase(), v.id);
    vehiculoMap.set(v.id.toString(), v.id); // También permitir por ID directo
  });

  const errores: string[] = [];
  const planillasValidas: any[] = [];

  for (let i = 0; i < planillas.length; i++) {
    const p = planillas[i];
    const fila = i + 2; // +2 porque Excel empieza en 1 y hay encabezado

    // Buscar vehiculo_id por codigo_vehiculo o id directo
    const vehiculoKey = p.vehiculo_id?.toString().trim().toUpperCase() || p.codigo_vehiculo?.toString().trim().toUpperCase();
    const vehiculoId = vehiculoMap.get(vehiculoKey);

    if (!vehiculoId) {
      errores.push(`Fila ${fila}: Vehículo "${vehiculoKey}" no encontrado`);
      continue;
    }

    if (!p.numero_planilla || !p.fecha || !p.conductor || !p.operador || !p.origen || !p.destino || !p.valor || !p.tipo_pago) {
      errores.push(`Fila ${fila}: Datos incompletos`);
      continue;
    }

    planillasValidas.push({
      numero_planilla: p.numero_planilla,
      fecha: p.fecha,
      vehiculo_id: vehiculoId,
      conductor: p.conductor,
      operador: p.operador,
      origen: p.origen,
      destino: p.destino,
      valor: parseFloat(p.valor),
      tipo_pago: p.tipo_pago,
      estado: p.estado || 'pendiente',
    });
  }

  if (planillasValidas.length === 0) {
    return { error: errores.length > 0 ? errores.join('\n') : 'No hay datos válidos para importar.' };
  }

  for (const planilla of planillasValidas) {
    await execute(
      `INSERT INTO planillas (numero_planilla, fecha, vehiculo_id, conductor, operador, origen, destino, valor, tipo_pago, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [planilla.numero_planilla, planilla.fecha, planilla.vehiculo_id, planilla.conductor, planilla.operador, 
       planilla.origen, planilla.destino, planilla.valor, planilla.tipo_pago, planilla.estado]
    );
  }

  const resultado: { success: boolean; cantidad: number; errores?: string[] } = { 
    success: true, 
    cantidad: planillasValidas.length 
  };
  
  if (errores.length > 0) {
    resultado.errores = errores;
  }

  return resultado;
}
