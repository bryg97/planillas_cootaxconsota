import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
  try {
    const result = await pool.query<T>(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T | null> {
  const results = await query<T>(text, params);
  return results.length > 0 ? results[0] : null;
}

export async function execute<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
  try {
    const result = await pool.query<T>(text, params);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
