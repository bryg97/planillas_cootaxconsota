import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planillas = body.planillas;
    if (!Array.isArray(planillas) || planillas.length === 0) {
      return NextResponse.json({ error: 'No hay datos para importar.' }, { status: 400 });
    }
    const planillasValidas = planillas.map((p: any) => ({
      numero_planilla: p.numero_planilla,
      fecha: p.fecha,
      vehiculo_id: parseInt(p.vehiculo_id),
      conductor: p.conductor,
      operador: p.operador,
      origen: p.origen,
      destino: p.destino,
      valor: parseFloat(p.valor),
      tipo_pago: p.tipo_pago,
      estado: p.estado || 'pendiente',
    })).filter(p => p.numero_planilla && p.fecha && p.vehiculo_id && p.conductor && p.operador && p.origen && p.destino && p.valor && p.tipo_pago);

    if (planillasValidas.length === 0) {
      return NextResponse.json({ error: 'No hay datos válidos para importar.' }, { status: 400 });
    }

    // Insertar planillas
    for (const planilla of planillasValidas) {
      await execute(
        `INSERT INTO planillas (numero_planilla, fecha, vehiculo_id, conductor, operador, origen, destino, valor, tipo_pago, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [planilla.numero_planilla, planilla.fecha, planilla.vehiculo_id, planilla.conductor, planilla.operador, 
         planilla.origen, planilla.destino, planilla.valor, planilla.tipo_pago, planilla.estado]
      );
    }

    return NextResponse.json({ success: true, cantidad: planillasValidas.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error inesperado.' }, { status: 500 });
  }
}
