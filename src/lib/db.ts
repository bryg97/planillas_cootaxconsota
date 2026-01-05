import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function queryOne(text: string, params?: any[]) {
  const results = await query(text, params);
  return results.length > 0 ? results[0] : null;
}

export async function execute(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
