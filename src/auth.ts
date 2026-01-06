import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

type DbUser = {
  id: number;
  usuario: string;
  nombre: string;
  password: string;
  rol: string;
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
          const users = await query<DbUser>(
            'SELECT id, usuario, nombre, password, rol FROM usuarios WHERE usuario = $1',
            [email]
          );

          if (users.length === 0) {
            return null;
          }

          const user = users[0];

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.usuario,
            name: user.nombre,
            role: user.rol
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
    maxAge: 24 * 60 * 60 // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production'
};
