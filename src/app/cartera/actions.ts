'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notificarPagoVehiculo } from '@/lib/telegram';

export async function getCarteraVehiculos() {
  const adminClient = createAdminClient();
  
  // Obtener vehículos con planillas pendientes
  const { data } = await adminClient
    .from('planillas')
    .select(`
      id,
      numero_planilla,
      valor,
      fecha,
      conductor,
      vehiculo_id,
      vehiculos:vehiculo_id (id, codigo_vehiculo)
    `)
    .eq('tipo_pago', 'credito')
    .eq('estado', 'pendiente')
    .order('fecha', { ascending: false });

  if (!data) return [];

  // Agrupar por vehículo
  const vehiculosMap = new Map();
  
  data.forEach((planilla: any) => {
    const vehiculoId = planilla.vehiculo_id;
    const vehiculoCodigo = planilla.vehiculos?.codigo_vehiculo;
    
    if (!vehiculosMap.has(vehiculoId)) {
      vehiculosMap.set(vehiculoId, {
        vehiculo_id: vehiculoId,
        codigo_vehiculo: vehiculoCodigo,
        planillas: [],
        total: 0
      });
    }
    
    const vehiculo = vehiculosMap.get(vehiculoId);
    vehiculo.planillas.push(planilla);
    vehiculo.total += planilla.valor || 0;
  });

  return Array.from(vehiculosMap.values());
}

export async function procesarPagoVehiculo(vehiculoId: number, planillaIds: number[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  const adminClient = createAdminClient();
  
  // Obtener datos del usuario (tesorera)
  const { data: userData } = await adminClient
    .from('usuarios')
    .select('id, usuario')
    .eq('usuario', user.email)
    .single();

  if (!userData) {
    return { error: 'Usuario no encontrado' };
  }

  // Obtener datos del vehículo y planillas
  const { data: vehiculo } = await adminClient
    .from('vehiculos')
    .select('codigo_vehiculo')
    .eq('id', vehiculoId)
    .single();

  const { data: planillas } = await adminClient
    .from('planillas')
    .select('numero_planilla, valor')
    .in('id', planillaIds);

  if (!planillas || planillas.length === 0) {
    return { error: 'No se encontraron planillas' };
  }

  // Actualizar estado de planillas a 'pagada'
  const { error: updateError } = await adminClient
    .from('planillas')
    .update({ estado: 'pagada' })
    .in('id', planillaIds);

  if (updateError) {
    return { error: updateError.message };
  }

  // Registrar recaudos
  const recaudos = planillaIds.map(planillaId => ({
    planilla_id: planillaId,
    vehiculo_id: vehiculoId,
    monto: planillas.find(p => p.id === planillaId)?.valor || 0,
    tipo: 'pago_tesorera',
    recaudado_por: userData.id
  }));

  const { error: recaudoError } = await adminClient
    .from('recaudos')
    .insert(recaudos);

  if (recaudoError) {
    console.error('Error registrando recaudos:', recaudoError);
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
    vehiculo: vehiculo?.codigo_vehiculo || '',
    autorizo: userData.usuario,
    planillas: planillas.map(p => ({
      numero: p.numero_planilla,
      monto: p.valor
    })),
    total: total,
    fecha: fechaFormateada
  });

  revalidatePath('/cartera');
  return { success: true };
}
