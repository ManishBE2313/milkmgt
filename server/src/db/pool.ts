import { Pool, QueryResult, PoolClient, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'milkmgt',
  password: process.env.DB_PASSWORD || 'root',
  port: Number(process.env.DB_PORT) || 5432,
  
  // Connection pool configuration
  max: 20, // maximum number of connections in the pool
  connectionTimeoutMillis: 5000, // time it takes for a connection to attempt a query
  idleTimeoutMillis: 30000, // time it takes for an idle connection to be closed in the pool
  allowExitOnIdle: false
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database: milkmgt');
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Helper function to execute queries with logging
const query = async <T extends QueryResultRow = any>(
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

// Helper function to get a client from the pool (for transactions)
const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the query method to keep track of the last query executed
  client.query = ((...args: Parameters<typeof originalQuery>) => {
    return originalQuery(...args);
  }) as typeof originalQuery;
  
  client.release = (): void => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    originalRelease();
  };
  
  return client;
};

// Verify connection on startup
const verifyConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection verified successfully');
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    throw error;
  }
};

export { pool, query, getClient, verifyConnection };
