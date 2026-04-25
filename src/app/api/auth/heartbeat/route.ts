import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helper';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const hasLastSeenColumn = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
          AND column_name = 'last_seen_at'
      ) AS exists`
    );

    if (hasLastSeenColumn?.[0]?.exists) {
      await query('UPDATE usuarios SET last_seen_at = NOW() WHERE id = $1', [session.user.id]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
