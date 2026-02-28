import { pool } from './pool';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('Running database migrations...');

    const customerColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='deliveries' AND column_name='customer_id';
    `);

    if (customerColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE deliveries
        ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
      `);
    }

    const passwordHashColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='password_hash';
    `);

    if (passwordHashColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN password_hash VARCHAR(255);
      `);
    }

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_deliveries_customer
      ON deliveries(customer_id);
    `);

    await pool.query(`
      ALTER TABLE deliveries
      DROP CONSTRAINT IF EXISTS deliveries_user_id_delivery_date;
    `);

    await pool.query(`
      ALTER TABLE deliveries
      DROP CONSTRAINT IF EXISTS deliveries_user_id_delivery_date_key;
    `);

    await pool.query(`
      DROP INDEX IF EXISTS deliveries_user_id_delivery_date;
    `);

    await pool.query(`
      DROP INDEX IF EXISTS deliveries_user_id_delivery_date_key;
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_user_date_customer
      ON deliveries(user_id, delivery_date, COALESCE(customer_id, 0));
    `);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};
