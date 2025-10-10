import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'milkmgt',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export const verifyConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log(`✅ Connected to PostgreSQL database: ${process.env.DB_NAME || 'milkmgt'}`);
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL database:', error);
    throw error;
  }
};

// Query helper with logging
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};
