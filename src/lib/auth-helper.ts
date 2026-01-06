import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function getSession() {
  return await getServerSession(authOptions);
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
