import { NextRequest, NextResponse } from 'next/server';
import { importarPlanillasDesdeExcel } from '@/app/planillas/importarExcelAction';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planillas = body.planillas;
    
    if (!Array.isArray(planillas) || planillas.length === 0) {
      return NextResponse.json({ error: 'No hay datos para importar.' }, { status: 400 });
    }

    // Usar la función que convierte codigo_vehiculo -> vehiculo_id
    const resultado = await importarPlanillasDesdeExcel(planillas);

    if ('error' in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    return NextResponse.json(resultado);
  } catch (e: unknown) {
    console.error('Error importando planillas:', e);
    const message = e instanceof Error ? e.message : 'Error inesperado.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
