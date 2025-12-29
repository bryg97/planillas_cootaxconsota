import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import VehiculosClient from './VehiculosClient';


export default async function VehiculosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }


  // Obtener el rol del usuario desde la tabla usuarios
  const adminClient = createAdminClient();
  let { data: usuarioRow, error } = await adminClient
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single();

  // Si no se encuentra por auth_id, intentar por email (caso admin antiguos)
  if (error || !usuarioRow) {
    const { data: usuarioPorEmail, error: errorEmail } = await adminClient
      .from('usuarios')
      .select('rol')
      .eq('usuario', user.email)
      .single();
    usuarioRow = usuarioPorEmail;
    error = errorEmail;
  }

  if (error || !usuarioRow) {
    // Si no se encuentra el usuario, redirigir al login por seguridad
    redirect('/login');
  }

  if (usuarioRow.rol !== 'tesorera' && usuarioRow.rol !== 'administrador') {
    // Si no es tesorera ni administrador, redirigir al dashboard
    redirect('/dashboard');
  }

  // Obtener vehículos y calcular saldo pendiente por cada uno
  const { data: vehiculosBase } = await adminClient
    .from('vehiculos')
    .select('*')
    .order('codigo_vehiculo', { ascending: true });

  // Para cada vehículo, sumar el valor de planillas pendientes
  const vehiculos = await Promise.all(
    (vehiculosBase || []).map(async (vehiculo) => {
      const { data: planillasPendientes } = await adminClient
        .from('planillas')
        .select('valor')
        .eq('vehiculo_id', vehiculo.id)
        .eq('estado', 'pendiente');
      const saldo_pendiente = (planillasPendientes || []).reduce((sum, p) => sum + (p.valor || 0), 0);
      return { ...vehiculo, saldo_pendiente };
    })
  );

  return <VehiculosClient vehiculos={vehiculos} />;
}

