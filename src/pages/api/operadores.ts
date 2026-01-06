import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { correo } = req.query;
  if (!correo || typeof correo !== 'string') {
    return res.status(400).json([]);
  }
  
  const data = await query(
    'SELECT * FROM modulos WHERE descripcion = $1 AND correo = $2',
    ['Operador', correo]
  );
  
  res.status(200).json(data || []);
}
