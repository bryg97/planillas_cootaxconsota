import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { query } from '@/lib/db';

export async function getSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return session;
  }

  const currentSessionVersion = await query<{ session_version: string | null }>(
    'SELECT session_version FROM usuarios WHERE id = $1',
    [session.user.id]
  );

  const storedSessionVersion = currentSessionVersion[0]?.session_version ?? null;
  const tokenSessionVersion = session.user.sessionVersion ?? null;

  if (storedSessionVersion && storedSessionVersion !== tokenSessionVersion) {
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role
  };
}
