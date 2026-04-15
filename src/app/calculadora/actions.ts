'use server';

import { revalidatePath } from 'next/cache';
import { execute, query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';

type RecargoRow = {
  id: number;
  nombre: string;
  descripcion: string | null;
  valor: number | string;
};

type UsuarioRol = {
  rol: string;
};

async function validarAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.email) {
    return { ok: false, error: 'Sesión no válida' };
  }

  const usuario = await queryOne<UsuarioRol>(
    'SELECT rol FROM usuarios WHERE usuario = $1',
    [currentUser.email]
  );

  if (!usuario || usuario.rol !== 'administrador') {
    return { ok: false, error: 'Solo el administrador puede gestionar recargos' };
  }

  return { ok: true };
}

export async function createRecargoCalculadora(formData: FormData) {
  try {
    const permiso = await validarAdmin();
    if (!permiso.ok) {
      return { success: false, error: permiso.error };
    }

    const nombre = (formData.get('nombre') as string | null)?.trim() || '';
    const descripcion = (formData.get('descripcion') as string | null)?.trim() || '';
    const valor = Number(formData.get('valor'));

    if (!nombre) {
      return { success: false, error: 'El nombre del recargo es requerido' };
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      return { success: false, error: 'El valor del recargo debe ser mayor a 0' };
    }

    const creado = await query<RecargoRow>(
      `INSERT INTO calculadora_recargos (nombre, descripcion, valor)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, descripcion, valor`,
      [nombre, descripcion || null, valor]
    );

    revalidatePath('/calculadora');

    return {
      success: true,
      data: {
        ...creado?.[0],
        valor: Number(creado?.[0]?.valor || 0)
      }
    };
  } catch (error: any) {
    if (String(error?.message || '').includes('relation "calculadora_recargos" does not exist')) {
      return {
        success: false,
        error: 'La tabla de recargos no existe. Ejecuta la migración de recargos de calculadora.'
      };
    }

    return { success: false, error: error?.message || 'Error al crear recargo' };
  }
}

export async function deleteRecargoCalculadora(id: number) {
  try {
    const permiso = await validarAdmin();
    if (!permiso.ok) {
      return { success: false, error: permiso.error };
    }

    if (!id || id <= 0) {
      return { success: false, error: 'ID inválido' };
    }

    await execute('DELETE FROM calculadora_recargos WHERE id = $1', [id]);

    revalidatePath('/calculadora');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al eliminar recargo' };
  }
}
