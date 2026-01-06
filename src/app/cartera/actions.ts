'use server';

import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { notificarPagoVehiculo } from '@/lib/telegram';

type PlanillaPendiente = {
  id: number;
  numero_planilla: string;
  valor: number;
  fecha: string;
  conductor: string;
  vehiculo_id: number;
  codigo_vehiculo: string;
};

type UsuarioRow = {
  id: number;
  usuario: string;
};

type VehiculoRow = {
  codigo_vehiculo: string;
};

type PlanillaPago = {
  id: number;
  numero_planilla: string;
  valor: number;
};

export async function getCarteraVehiculos() {
  // Obtener vehículos con planillas pendientes de crédito
  const planillas = await query<PlanillaPendiente>(`
    SELECT 
      p.id,
      p.numero_planilla,
      p.valor,
      p.fecha,
      p.conductor,
      p.vehiculo_id,
      v.codigo_vehiculo
    FROM planillas p
    LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
    WHERE p.tipo_pago = 'credito' AND p.estado = 'pendiente'
    ORDER BY p.fecha DESC
  `);

  if (!planillas || planillas.length === 0) return [];

  // Agrupar por vehículo
  const vehiculosMap = new Map<
    number,
    {
      vehiculo_id: number;
      codigo_vehiculo: string;
      planillas: PlanillaPendiente[];
      total: number;
    }
  >();
  
  planillas.forEach((planilla) => {
    const vehiculoId = planilla.vehiculo_id;
    const vehiculoCodigo = planilla.codigo_vehiculo;
    
    let vehiculo = vehiculosMap.get(vehiculoId);
    if (!vehiculo) {
      vehiculo = {
        vehiculo_id: vehiculoId,
        codigo_vehiculo: vehiculoCodigo,
        planillas: [],
        total: 0
      };
      vehiculosMap.set(vehiculoId, vehiculo);
    }
    
    vehiculo.planillas.push(planilla);
    vehiculo.total += planilla.valor || 0;
  });

  return Array.from(vehiculosMap.values());
}

export async function procesarPagoVehiculo(vehiculoId: number, planillaIds: number[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  // Obtener datos del usuario (tesorera)
  const userData = await query<UsuarioRow>(
    'SELECT id, usuario FROM usuarios WHERE usuario = $1',
    [user.email]
  );

  if (!userData || userData.length === 0) {
    return { error: 'Usuario no encontrado' };
  }

  const tesoreraId = userData[0].id;

  // Obtener datos del vehículo y planillas
  const vehiculo = await query<VehiculoRow>(
    'SELECT codigo_vehiculo FROM vehiculos WHERE id = $1',
    [vehiculoId]
  );

  const planillas = await query<PlanillaPago>(
    'SELECT id, numero_planilla, valor FROM planillas WHERE id = ANY($1::int[])',
    [planillaIds]
  );

  if (!planillas || planillas.length === 0) {
    return { error: 'No se encontraron planillas' };
  }

  // Actualizar estado de planillas a 'pagada'
  await execute(
    'UPDATE planillas SET estado = $1 WHERE id = ANY($2::int[])',
    ['pagada', planillaIds]
  );

  // Registrar recaudos
  for (const planillaId of planillaIds) {
    const planilla = planillas.find((p) => p.id === planillaId);
    await execute(
      `INSERT INTO recaudos (planilla_id, vehiculo_id, monto, tipo, recaudado_por) 
       VALUES ($1, $2, $3, $4, $5)`,
      [planillaId, vehiculoId, planilla?.valor || 0, 'pago_tesorera', tesoreraId]
    );
  }

  // Enviar notificación Telegram
  const total = planillas.reduce((sum, p) => sum + (p.valor || 0), 0);
  const fechaFormateada = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  await notificarPagoVehiculo({
    vehiculo: vehiculo?.[0]?.codigo_vehiculo || '',
    autorizo: userData[0].usuario,
    planillas: planillas.map((p) => ({
      numero: p.numero_planilla,
      monto: p.valor
    })),
    total: total,
    fecha: fechaFormateada
  });

  revalidatePath('/cartera');
  return { success: true };
}
