import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

type DbUser = {
  id: number;
  usuario: string;
  clave: string;
  rol: string;
  activo: boolean;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== 'string' || typeof password !== 'string') {
          return null;
        }

        try {
          const hasActivoColumn = await query<{ exists: boolean }>(
            `SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'usuarios'
                AND column_name = 'activo'
            ) AS exists`
          );

          const users = hasActivoColumn?.[0]?.exists
            ? await query<DbUser>(
                'SELECT id, usuario, clave, rol, activo FROM usuarios WHERE usuario = $1',
                [email]
              )
            : await query<DbUser>(
                'SELECT id, usuario, clave, rol, true AS activo FROM usuarios WHERE usuario = $1',
                [email]
              );

          if (users.length === 0) {
            return null;
          }

          const user = users[0];

          if (!user.activo) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.clave);

          if (!isPasswordValid) {
            return null;
          }

          const hasSessionVersionColumn = await query<{ exists: boolean }>(
            `SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'usuarios'
                AND column_name = 'session_version'
            ) AS exists`
          );

          const hasLastSeenColumn = await query<{ exists: boolean }>(
            `SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'usuarios'
                AND column_name = 'last_seen_at'
            ) AS exists`
          );

          const sessionVersion = randomUUID();

          if (hasSessionVersionColumn?.[0]?.exists) {
            await query(
              'UPDATE usuarios SET session_version = $1 WHERE id = $2',
              [sessionVersion, user.id]
            );
          }

          if (hasLastSeenColumn?.[0]?.exists) {
            await query(
              'UPDATE usuarios SET last_seen_at = NOW() WHERE id = $1',
              [user.id]
            );
          }

          return {
            id: user.id.toString(),
            email: user.usuario,
            name: user.usuario,
            role: user.rol,
            sessionVersion
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === 'string') {
          session.user.id = token.id;
        }
        if (typeof token.role === 'string') {
          session.user.role = token.role;
        }
        if (typeof token.sessionVersion === 'string') {
          session.user.sessionVersion = token.sessionVersion;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 6 * 60 * 60 // 6 horas
  },
  secret: process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production'
};
