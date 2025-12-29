'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notificarDineroEntregado } from '@/lib/telegram';

export async function getPlanillasParaLiquidar(operadorId?: number) {
  const adminClient = createAdminClient();
  
  // Solo planillas con tipo_pago contado o estado recaudada (crédito ya cobrado)
  // Que no estén liquidadas, pagadas o aprobadas
  let query = adminClient
    .from('planillas')
    .select(`
      id,
      numero_planilla,
      valor,
      fecha,
      conductor,
      operador,
      tipo_pago,
      estado,
      vehiculo_id,
      vehiculos:vehiculo_id (codigo_vehiculo)
    `)
    .in('estado', ['pendiente', 'recaudada'])
    .order('fecha', { ascending: false });

  if (operadorId) {
    query = query.eq('operador_id', operadorId);
  }

  const { data } = await query;
  
  // Filtrar: incluir solo planillas de contado (cualquier estado) o crédito recaudado
  const planillasFiltradas = data?.filter(p => 
    p.tipo_pago === 'contado' || (p.tipo_pago === 'credito' && p.estado === 'recaudada')
  ) || [];
  
  return planillasFiltradas;
}

export async function crearLiquidacion(planillaIds: number[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  const adminClient = createAdminClient();
  
  // Obtener datos del operador
  const { data: userData } = await adminClient
    .from('usuarios')
    .select('id, usuario')
    .eq('usuario', user.email)
    .single();

  if (!userData) {
    return { error: 'Usuario no encontrado' };
  }

  // Obtener planillas
  const { data: planillas } = await adminClient
    .from('planillas')
    .select('*')
    .in('id', planillaIds);

  if (!planillas || planillas.length === 0) {
    return { error: 'No se encontraron planillas' };
  }

  const total = planillas.reduce((sum, p) => sum + (p.valor || 0), 0);

  // Crear registro de liquidación
  const { data: liquidacion, error: liquidacionError } = await adminClient
    .from('liquidaciones')
    .insert({
      operador_id: userData.id,
      total: total,
      estado: 'pendiente',
      fecha: new Date().toISOString()
    })
    .select()
    .single();

  if (liquidacionError) {
    return { error: liquidacionError.message };
  }

  // Crear detalle de liquidación
  const detalles = planillaIds.map(planillaId => {
    const planilla = planillas.find(p => p.id === planillaId);
    return {
      liquidacion_id: liquidacion.id,
      planilla_id: planillaId,
      monto: planilla?.valor || 0
    };
  });

  const { error: detalleError } = await adminClient
    .from('liquidaciones_detalle')
    .insert(detalles);

  if (detalleError) {
    return { error: detalleError.message };
  }

  // Actualizar estado de planillas a 'liquidada'
  const { error: updateError } = await adminClient
    .from('planillas')
    .update({ estado: 'liquidada' })
    .in('id', planillaIds);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/liquidaciones');
  return { success: true, liquidacionId: liquidacion.id };
}

export async function getLiquidacionesPendientes() {
  const adminClient = createAdminClient();
  
  const { data } = await adminClient
    .from('liquidaciones')
    .select(`
      id,
      total,
      fecha,
      estado,
      operador_id,
      usuarios:operador_id (usuario),
      liquidaciones_detalle (
        planilla_id,
        monto,
        planillas:planilla_id (numero_planilla, vehiculos:vehiculo_id (codigo_vehiculo))
      )
    `)
    .eq('estado', 'pendiente')
    .order('fecha', { ascending: false });

  return data || [];
}

export async function aprobarLiquidacion(liquidacionId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  const adminClient = createAdminClient();
  
  // LOG: Mostrar el email que se busca
  console.log('[AprobarLiquidacion] Buscando usuario con email:', user.email);
  const { data: tesorera, error: tesoreraError } = await adminClient
    .from('usuarios')
    .select('id, usuario, auth_id')
    .eq('usuario', user.email)
    .single();
  if (tesoreraError) {
    console.log('[AprobarLiquidacion] Error al buscar usuario:', tesoreraError.message);
  }
  console.log('[AprobarLiquidacion] Usuario encontrado:', tesorera);

  if (!tesorera) {
    return { error: 'Usuario no encontrado' };
  }
  if (!tesorera.auth_id) {
    return { error: 'El usuario no tiene auth_id, no se puede aprobar.' };
  }

  // Obtener liquidación con detalles
  const { data: liquidacion } = await adminClient
    .from('liquidaciones')
    .select(`
      *,
      usuarios:operador_id (usuario),
      liquidaciones_detalle (
        planilla_id,
        monto,
        planillas:planilla_id (numero_planilla)
      )
    `)
    .eq('id', liquidacionId)
    .single();

  if (!liquidacion) {
    return { error: 'Liquidación no encontrada' };
  }

  // Actualizar estado de la liquidación
  const { error: updateError } = await adminClient
    .from('liquidaciones')
    .update({ 
      estado: 'aprobada',
      aprobada_por: tesorera.auth_id,
      fecha_aprobacion: new Date().toISOString()
    })
    .eq('id', liquidacionId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Enviar notificación Telegram
  const planillas = liquidacion.liquidaciones_detalle.map((d: any) => ({
    numero: d.planillas.numero_planilla,
    monto: d.monto
  }));

  await notificarDineroEntregado({
    operador: liquidacion.usuarios.usuario,
    recibe: tesorera.usuario,
    planillas: planillas
  });

  revalidatePath('/liquidaciones');
  return { success: true };
}
