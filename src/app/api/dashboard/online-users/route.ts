import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helper';
import { query } from '@/lib/db';

type OnlineUsersCountRow = { count: string };
type OnlineUserRow = { usuario: string };

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasLastSeenColumn = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
          AND column_name = 'last_seen_at'
      ) AS exists`
    );

    if (!hasLastSeenColumn?.[0]?.exists) {
      return NextResponse.json({ usuariosEnLinea: 0, usuariosEnLineaLista: [] });
    }

    const usuariosEnLineaCount = await query<OnlineUsersCountRow>(`
      SELECT COUNT(*)::text AS count
      FROM usuarios
      WHERE activo = true
        AND last_seen_at IS NOT NULL
        AND last_seen_at >= NOW() - INTERVAL '3 minutes'
    `);

    const usuariosEnLineaRows = await query<OnlineUserRow>(`
      SELECT usuario
      FROM usuarios
      WHERE activo = true
        AND last_seen_at IS NOT NULL
        AND last_seen_at >= NOW() - INTERVAL '3 minutes'
      ORDER BY last_seen_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      usuariosEnLinea: parseInt(usuariosEnLineaCount?.[0]?.count || '0', 10),
      usuariosEnLineaLista: usuariosEnLineaRows.map((row) => row.usuario),
    });
  } catch (error) {
    console.error('Error obteniendo usuarios en linea:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
