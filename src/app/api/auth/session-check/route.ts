import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helper';

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}