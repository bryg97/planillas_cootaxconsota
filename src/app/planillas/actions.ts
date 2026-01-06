'use server';

import { query, queryOne, execute } from '@/lib/db';
import { getSession } from '@/lib/auth-helper';
import { revalidatePath } from 'next/cache';
import { notificarNuevaPlanillaCredito, notificarRecaudoCredito } from '@/lib/telegram';

// Tipos de ayuda para resultados de BD
interface PlanillaDeuda {
  id: number;
  numero_planilla: string;
  valor: number;
  fecha: string;
  conductor: string;
}

interface UsuarioBasico {
  id: number;
  usuario: string | null;
  rol?: string;
}

interface PlanillaRecaudo {
  id: number;
  numero_planilla: string;
  valor: number;
  tipo_pago: string;
  fecha: string;
  conductor: string;
  placa: string | null;
}

export async function verificarNumeroPlanillaExiste(numeroPlanilla: string) {
  try {
    const result = await queryOne(
      'SELECT id FROM planillas WHERE numero_planilla = $1',
      [numeroPlanilla]
    );
    return !!result;
  } catch (error) {
    console.error('Error verificando número de planilla:', error);
    return false;
  }
}

export async function verificarDeudaVehiculo(vehiculoId: number) {
  try {
    const planillas = await query<PlanillaDeuda>(
      `SELECT id, numero_planilla, valor, fecha, conductor 
       FROM planillas 
       WHERE vehiculo_id = $1 AND tipo_pago = 'credito' AND estado = 'pendiente'
       ORDER BY fecha ASC`,
      [vehiculoId]
    );

    if (!planillas || planillas.length === 0) {
      return null;
    }

    const total = planillas.reduce((sum, p) => sum + (p.valor || 0), 0);

    return {
      planillas,
      cantidad: planillas.length,
      total
    };
  } catch (error) {
    console.error('Error verificando deuda del vehículo:', error);
    return null;
  }
}

export async function recaudarPlanillas(planillaIds: number[]) {
  if (!planillaIds || planillaIds.length === 0) {
    return { error: 'Debe seleccionar al menos una planilla' };
  }

  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: 'Usuario no autenticado' };
    }

    // Obtener datos del usuario
    const userData = await queryOne<UsuarioBasico>(
      'SELECT id, usuario FROM usuarios WHERE usuario = $1',
      [session.user.email]
    );

    if (!userData) {
      return { error: 'Usuario no encontrado' };
    }

    // Obtener detalles de las planillas (incluir operador para notificación)
    const planillasData = await query<PlanillaRecaudo & { operador?: string }>(
      `SELECT p.id, p.numero_planilla, p.valor, p.tipo_pago, p.fecha, p.conductor, p.operador, v.codigo_vehiculo as placa
       FROM planillas p
       LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
       WHERE p.id = ANY($1::int[])`,
      [planillaIds]
    );

    // Actualizar estado a 'recaudada'
    await execute(
      'UPDATE planillas SET estado = $1 WHERE id = ANY($2::int[])',
      ['recaudada', planillaIds]
    );

    // Auditoría: registrar UPDATE masivo
    for (const planillaId of planillaIds) {
      await execute(
        `INSERT INTO auditoria (usuario, accion, detalles)
         VALUES ($1, $2, $3)`,
        [
          session.user.email,
          'UPDATE',
          `Recaudó planilla (ID: ${planillaId}) en tabla planillas`
        ]
      );
    }

    // Crear registros de recaudos
    for (const planillaId of planillaIds) {
      await execute(
        `INSERT INTO recaudos (planilla_id, recaudado_por, monto, tipo)
         VALUES ($1, $2, $3, $4)`,
        [planillaId, userData.id, 0, 'recaudo']
      );
    }

    // Notificar recaudos de crédito
    if (planillasData && planillasData.length > 0) {
      const planillasCredito = planillasData.filter((p) => p.tipo_pago === 'credito');

      if (planillasCredito.length > 0) {
        const fecha = new Date().toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const totalRecaudado = planillasCredito.reduce((sum, p) => sum + (parseFloat(String(p.valor)) || 0), 0);

        // Obtener el nombre del operador de la primera planilla
        const nombreOperador = planillasCredito[0]?.operador || userData.usuario || 'Operador';

        await notificarRecaudoCredito({
          operador: nombreOperador,
          planillas: planillasCredito.map((p) => ({
            numero: p.numero_planilla,
            monto: parseFloat(String(p.valor)) || 0,
            vehiculo: p.placa || 'N/A',
            conductor: p.conductor
          })),
          total: totalRecaudado,
          fecha
        });
      }
    }

    revalidatePath('/planillas');
    revalidatePath('/cartera');
    revalidatePath('/operaciones');

    return { success: true, cantidad: planillaIds.length };
  } catch (error) {
    console.error('Error recaudando planillas:', error);
    return { error: 'Error al recaudar planillas' };
  }
}

export async function createPlanilla(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: 'Usuario no autenticado' };
    }

    const usarSaldoFavor = formData.get('usar_saldo_favor') === '1';
    const vehiculoId = parseInt(formData.get('vehiculo_id') as string);
    const conductor = formData.get('conductor') as string;
    const operadorNombre = formData.get('operador') as string;
    const valor = parseFloat(formData.get('valor') as string);
    const numeroPlanilla = formData.get('numero_planilla') as string;
    const fecha = formData.get('fecha') as string;
    const tipoPago = formData.get('tipo_pago') as string;
    const origen = formData.get('origen') as string;
    const destino = formData.get('destino') as string;

    console.log('CreatePlanilla - Datos recibidos:', {
      vehiculoId,
      conductor,
      operadorNombre,
      valor,
      numeroPlanilla,
      fecha,
      tipoPago,
      origen,
      destino
    });

    if (!vehiculoId || !conductor || !valor || !numeroPlanilla || !fecha || !tipoPago || !operadorNombre) {
      const missingFields = [];
      if (!vehiculoId) missingFields.push('vehiculo_id');
      if (!conductor) missingFields.push('conductor');
      if (!valor) missingFields.push('valor');
      if (!numeroPlanilla) missingFields.push('numero_planilla');
      if (!fecha) missingFields.push('fecha');
      if (!tipoPago) missingFields.push('tipo_pago');
      if (!operadorNombre) missingFields.push('operador');
      return { error: `Campos faltantes: ${missingFields.join(', ')}` };
    }

    // Obtener el ID del usuario
    const userData = await queryOne<{ id: number }>(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [session.user.email]
    );

    if (!userData) {
      return { error: 'Usuario no encontrado' };
    }

    // Obtener datos del vehículo
    const vehiculo = await queryOne<{ codigo_vehiculo: string; saldo: number }>(
      'SELECT codigo_vehiculo, saldo FROM vehiculos WHERE id = $1',
      [vehiculoId]
    );

    // Insertar planilla
    const result = await queryOne<{ id: number }>(
      `INSERT INTO planillas (
        vehiculo_id, conductor, operador, valor, numero_planilla, fecha,
        operador_id, pagada, tipo_pago, estado, origen, destino
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        vehiculoId,
        conductor,
        operadorNombre,
        valor,
        numeroPlanilla,
        fecha,
        userData.id,
        usarSaldoFavor ? 1 : 0,
        tipoPago,
        usarSaldoFavor ? 'pagada' : 'pendiente',
        origen || null,
        destino || null
      ]
    );

    const planillaId = result?.id;

    // Auditoría
    if (planillaId) {
      await execute(
        `INSERT INTO auditoria (usuario, accion, detalles)
         VALUES ($1, $2, $3)`,
        [
          operadorNombre,
          'INSERT',
          `Creó planilla N° ${numeroPlanilla} (ID: ${planillaId}) para vehículo ${vehiculoId}`
        ]
      );
    }

    // Si se usó saldo a favor, actualizar el saldo del vehículo
    if (usarSaldoFavor && vehiculo && vehiculo.saldo > 0) {
      await execute(
        'UPDATE vehiculos SET saldo = 0 WHERE id = $1',
        [vehiculoId]
      );
    }

    // Enviar notificación Telegram solo si es crédito
    if (tipoPago === 'credito') {
      const fechaFormateada = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      await notificarNuevaPlanillaCredito({
        operador: operadorNombre,
        vehiculo: vehiculo?.codigo_vehiculo || '',
        conductor,
        numero_planilla: numeroPlanilla,
        fecha: fechaFormateada
      });
    }

    revalidatePath('/planillas');
    revalidatePath('/operaciones');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating planilla:', error);
    return { error: 'Error al crear la planilla' };
  }
}

export async function updatePlanilla(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: 'Usuario no autenticado' };
    }

    const id = parseInt(formData.get('id') as string);
    const vehiculoId = parseInt(formData.get('vehiculo_id') as string);
    const conductor = formData.get('conductor') as string;
    const operadorNombre = formData.get('operador') as string;
    const valor = parseFloat(formData.get('valor') as string);
    const numeroPlanilla = formData.get('numero_planilla') as string;
    const fecha = formData.get('fecha') as string;
    const tipoPago = formData.get('tipo_pago') as string;
    const estado = formData.get('estado') as string;
    const origen = formData.get('origen') as string;
    const destino = formData.get('destino') as string;

    if (!id || !vehiculoId || !conductor || !valor || !numeroPlanilla || !fecha || !tipoPago || !operadorNombre || !estado) {
      return { error: 'Todos los campos son requeridos' };
    }

    const result = await queryOne(
      `UPDATE planillas SET
        vehiculo_id = $1, conductor = $2, operador = $3, valor = $4,
        numero_planilla = $5, fecha = $6, tipo_pago = $7, estado = $8,
        origen = $9, destino = $10
       WHERE id = $11
       RETURNING *`,
      [vehiculoId, conductor, operadorNombre, valor, numeroPlanilla, fecha, tipoPago, estado, origen || null, destino || null, id]
    );

    // Auditoría
    await execute(
      `INSERT INTO auditoria (usuario, accion, detalles)
       VALUES ($1, $2, $3)`,
      [
        operadorNombre,
        'UPDATE',
        `Editó planilla N° ${numeroPlanilla} (ID: ${id}) en tabla planillas`
      ]
    );

    revalidatePath('/planillas');
    revalidatePath('/operaciones');
    revalidatePath('/historico');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating planilla:', error);
    return { error: 'Error al actualizar la planilla' };
  }
}

export async function eliminarPlanilla(planillaId: number) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: 'Usuario no autenticado' };
    }

    // Verificar que el usuario sea admin
    const userData = await queryOne<{ rol: string }>(
      'SELECT rol FROM usuarios WHERE usuario = $1',
      [session.user.email]
    );

    if (userData?.rol !== 'administrador') {
      return { error: 'No tienes permisos para eliminar planillas' };
    }

    // Eliminar la planilla
    await execute(
      'DELETE FROM planillas WHERE id = $1',
      [planillaId]
    );

    revalidatePath('/planillas');
    revalidatePath('/operaciones');
    revalidatePath('/historico');
    revalidatePath('/liquidaciones');

    return { success: true };
  } catch (error) {
    console.error('Error deleting planilla:', error);
    return { error: 'Error al eliminar la planilla' };
  }
}
