import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { correo } = req.query;
  if (!correo || typeof correo !== 'string') {
    return res.status(400).json([]);
  }
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('modulos')
    .select('*')
    .eq('descripcion', 'Operador')
    .eq('correo', correo);
  res.status(200).json(data || []);
}
