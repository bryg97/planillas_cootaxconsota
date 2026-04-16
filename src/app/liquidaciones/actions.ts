'use server';

import { revalidatePath } from 'next/cache';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { notificarDineroEntregado } from '@/lib/telegram';

type PlanillaRow = {
  id: number;
  numero_planilla: string;
  valor: number;
  fecha: string;
  conductor: string;
  operador: string | null;
  tipo_pago: string;
  estado: string;
  vehiculo_id: number;
  created_at: string;
  codigo_vehiculo: string | null;
  usuario: string | null;
  operador_nombre: string | null;
};

type UsuarioRow = {
  id: number;
  usuario: string;
  nombre?: string | null;
};

type LiquidacionRow = {
  id: number;
  total: number;
  fecha: string;
  estado: string;
  operador_id: number;
  usuario: string | null;
};

type DetalleRow = {
  planilla_id: number;
  monto: number;
  numero_planilla: string;
  codigo_vehiculo?: string | null;
  fecha?: string | null;
  conductor?: string | null;
  operador?: string | null;
  tipo_pago?: string | null;
  estado?: string | null;
};

export async function getPlanillasParaLiquidar() {
  try {
    console.log('=== getPlanillasParaLiquidar INICIO ===');
    
    // Obtener TODAS las planillas sin filtro de estado para debugging
    const planillas = await query<PlanillaRow>(`
      SELECT 
        p.id,
        p.numero_planilla,
        p.valor,
        p.fecha,
        p.conductor,
        p.operador,
        p.tipo_pago,
        p.estado,
        p.vehiculo_id,
        p.created_at,
        v.codigo_vehiculo,
        u.usuario,
        u.usuario as operador_nombre
      FROM planillas p
      LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
      LEFT JOIN usuarios u ON p.operador_id = u.id
      ORDER BY p.fecha DESC
    `);

    console.log('Total planillas en BD:', planillas?.length || 0);
    if (planillas && planillas.length > 0) {
      console.log('Primera planilla:', JSON.stringify(planillas[0]));
    }

    // Filtrar: solo planillas que NO estén liquidadas, pagadas o aprobadas
    // Y que sean: contado (cualquier estado) O crédito SOLO si ya fue recaudado
    const planillasFiltradas = planillas?.filter((p) => {
      const estado = (p.estado || '').toLowerCase();
      const tipoPago = (p.tipo_pago || '').toLowerCase();
      
      // Excluir las que ya fueron procesadas completamente
      if (estado === 'liquidada' || estado === 'pagada' || estado === 'aprobada') {
        return false;
      }
      
      // Si es contado, incluir siempre (no importa el estado)
      if (tipoPago === 'contado') {
        return true;
      }
      
      // Si es crédito, solo incluir si ya fue recaudado
      if (tipoPago === 'credito' && estado === 'recaudada') {
        return true;
      }
      
      // No incluir créditos pendientes
      return false;
    }) || [];

    console.log('Planillas para liquidar:', planillasFiltradas.length);

    return planillasFiltradas;
  } catch (error: any) {
    console.error('=== ERROR en getPlanillasParaLiquidar ===');
    console.error('Mensaje:', error?.message || error);
    console.error('Stack:', error?.stack);
    return [];
  }
}

export async function crearLiquidacion(planillaIds: number[]) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Usuario no autenticado' };
    }

    // Obtener datos del operador
    const userData = await query<UsuarioRow>(
      'SELECT id, usuario FROM usuarios WHERE usuario = $1',
      [user.email]
    );

    if (!userData || userData.length === 0) {
      return { error: 'Usuario no encontrado' };
    }

    const operadorId = userData[0].id;
    const nombreOperador = userData[0].usuario;

    // Obtener planillas
    const planillas = await query<PlanillaRow>(
      'SELECT * FROM planillas WHERE id = ANY($1::int[])',
      [planillaIds]
    );

    if (!planillas || planillas.length === 0) {
      return { error: 'No se encontraron planillas' };
    }

    const total = planillas.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);

    // Crear registro de liquidación
    const liquidacionResult = await query<{ id: number }>(
      `INSERT INTO liquidaciones (operador_id, total, estado, fecha, fecha_aprobacion)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [operadorId, total, 'aprobada']
    );

    if (!liquidacionResult || liquidacionResult.length === 0) {
      return { error: 'Error al crear liquidación' };
    }

    const liquidacionId = liquidacionResult[0].id;

    // Crear detalle de liquidación
    const detalles = planillaIds.map((planillaId) => {
      const planilla = planillas.find((p) => p.id === planillaId);
      return [liquidacionId, planillaId, planilla?.valor || 0];
    });

    for (const detalle of detalles) {
      await execute(
        'INSERT INTO liquidaciones_detalle (liquidacion_id, planilla_id, monto) VALUES ($1, $2, $3)',
        detalle
      );
    }

    // Actualizar estado de planillas a 'liquidada'
    await execute(
      'UPDATE planillas SET estado = $1 WHERE id = ANY($2::int[])',
      ['liquidada', planillaIds]
    );

    const planillasTelegram = planillas.map((planilla) => ({
      numero: planilla.numero_planilla,
      monto: parseFloat(String(planilla.valor)) || 0
    }));

    await notificarDineroEntregado({
      operador: nombreOperador,
      recibe: 'Sistema',
      planillas: planillasTelegram
    });

    revalidatePath('/liquidaciones');
    return { success: true, liquidacionId };
  } catch (error) {
    console.error('Error al crear liquidación:', error);
    return { error: 'Error al crear liquidación' };
  }
}

export async function getLiquidacionesPendientes() {
  try {
    const liquidaciones = await query<LiquidacionRow>(`
      SELECT 
        l.id,
        l.total,
        l.fecha,
        l.estado,
        l.operador_id,
        u.usuario
      FROM liquidaciones l
      LEFT JOIN usuarios u ON l.operador_id = u.id
      WHERE l.estado = 'pendiente'
      ORDER BY l.fecha DESC
    `);

    // Obtener detalles para cada liquidación
    const result = await Promise.all(
      (liquidaciones || []).map(async (liq) => {
        const detalles = await query<DetalleRow & { operador?: string }>(`
          SELECT 
            ld.planilla_id,
            ld.monto,
            p.numero_planilla,
            p.fecha,
            p.conductor,
            p.operador,
            p.tipo_pago,
            p.estado,
            v.codigo_vehiculo
          FROM liquidaciones_detalle ld
          LEFT JOIN planillas p ON ld.planilla_id = p.id
          LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
          WHERE ld.liquidacion_id = $1
        `, [liq.id]);

        // Obtener el nombre del operador de la primera planilla
        const operadorNombre = detalles?.[0]?.operador || liq.usuario;

        return {
          ...liq,
          operador_nombre: operadorNombre,
          detalles: detalles || []
        };
      })
    );

    return result;
  } catch (error) {
    console.error('Error al obtener liquidaciones pendientes:', error);
    return [];
  }
}

export async function getLiquidacionesHistorico() {
  try {
    const liquidaciones = await query<LiquidacionRow>(`
      SELECT
        l.id,
        l.total,
        COALESCE(l.fecha_aprobacion, l.fecha) as fecha,
        l.estado,
        l.operador_id,
        u.usuario
      FROM liquidaciones l
      LEFT JOIN usuarios u ON l.operador_id = u.id
      WHERE l.estado = 'aprobada'
      ORDER BY COALESCE(l.fecha_aprobacion, l.fecha) DESC
      LIMIT 120
    `);

    const result = await Promise.all(
      (liquidaciones || []).map(async (liq) => {
        const detalles = await query<DetalleRow & { operador?: string }>(`
          SELECT
            ld.planilla_id,
            ld.monto,
            p.numero_planilla,
            p.fecha,
            p.conductor,
            p.operador,
            p.tipo_pago,
            p.estado,
            v.codigo_vehiculo
          FROM liquidaciones_detalle ld
          LEFT JOIN planillas p ON ld.planilla_id = p.id
          LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
          WHERE ld.liquidacion_id = $1
        `, [liq.id]);

        const operadorNombre = detalles?.[0]?.operador || liq.usuario;

        return {
          ...liq,
          operador_nombre: operadorNombre,
          detalles: detalles || []
        };
      })
    );

    return result;
  } catch (error) {
    console.error('Error al obtener historico de liquidaciones:', error);
    return [];
  }
}

export async function aprobarLiquidacion(liquidacionId: number) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Usuario no autenticado' };
    }

    // LOG: Mostrar el email que se busca
    console.log('[AprobarLiquidacion] Buscando usuario con email:', user.email);
    const usuarioAprueba = await query<UsuarioRow>(
      'SELECT id, usuario FROM usuarios WHERE usuario = $1',
      [user.email]
    );

    if (!usuarioAprueba || usuarioAprueba.length === 0) {
      console.log('[AprobarLiquidacion] Error: usuario no encontrado');
      return { error: 'Usuario no encontrado' };
    }

    const usuarioId = usuarioAprueba[0].id;
    const nombreUsuarioAprueba = usuarioAprueba[0].usuario;

    // Obtener liquidación con detalles
    const liquidacion = await query<LiquidacionRow>(`
      SELECT 
        l.id,
        l.total,
        l.fecha,
        l.estado,
        l.operador_id,
        u.usuario
      FROM liquidaciones l
      LEFT JOIN usuarios u ON l.operador_id = u.id
      WHERE l.id = $1
    `, [liquidacionId]);

    if (!liquidacion || liquidacion.length === 0) {
      return { error: 'Liquidación no encontrada' };
    }

    const liq = liquidacion[0];

    // Obtener detalles (incluir operador de la planilla para notificación)
    const detalles = await query<DetalleRow & { operador?: string }>(`
      SELECT 
        ld.planilla_id,
        ld.monto,
        p.numero_planilla,
        p.operador
      FROM liquidaciones_detalle ld
      LEFT JOIN planillas p ON ld.planilla_id = p.id
      WHERE ld.liquidacion_id = $1
    `, [liquidacionId]);

    // Si ya fue auto-aprobada al crearla, mantenerla aprobada y solo notificar.
    await execute(
      `UPDATE liquidaciones 
       SET estado = $1, fecha_aprobacion = NOW()
       WHERE id = $2`,
      ['aprobada', liquidacionId]
    );

    // Enviar notificación Telegram
    const planillas = (detalles || []).map((d) => ({
      numero: d.numero_planilla,
      monto: parseFloat(String(d.monto)) || 0
    }));

    // Obtener nombre del operador desde la primera planilla
    const nombreOperador = detalles?.[0]?.operador || liq.usuario || 'Operador';

    // El nombre de quien aprueba es el usuario actual
    const nombreRecibe = nombreUsuarioAprueba;

    await notificarDineroEntregado({
      operador: nombreOperador,
      recibe: nombreRecibe,
      planillas: planillas
    });

    revalidatePath('/liquidaciones');
    return { success: true };
  } catch (error) {
    console.error('Error al aprobar liquidación:', error);
    return { error: 'Error al aprobar liquidación' };
  }
}

