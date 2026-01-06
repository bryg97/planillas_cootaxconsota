import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helper';
import { query } from '@/lib/db';
import HistoricoClient from './HistoricoClient';

export default async function HistoricoPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener planillas liquidadas y pagadas (histórico)
  const planillas = await query(`
    SELECT 
      p.*,
      v.codigo_vehiculo,
      u.usuario as operador_usuario
    FROM planillas p
    LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
    LEFT JOIN usuarios u ON p.operador_id = u.id
    WHERE p.estado IN ('liquidada', 'pagada', 'aprobada')
    ORDER BY p.fecha DESC
    LIMIT 100
  `);

  return <HistoricoClient planillas={planillas || []} />;
}
