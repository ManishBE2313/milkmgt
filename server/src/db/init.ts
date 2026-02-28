import { pool } from './pool';
import { runMigrations } from './migrations';

export const createTables = async (): Promise<void> => {
  try {
    console.log('🔄 Starting database initialization...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        fullname VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created/verified');

    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        contact VARCHAR(20),
        rate_per_litre DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
    `);
    console.log('✅ Customers table created/verified');

    // Create deliveries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        delivery_date DATE NOT NULL,
        quantity DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) NOT NULL CHECK (status IN ('delivered', 'absent', 'mixed', 'no_entry')),
        month_year VARCHAR(7) NOT NULL,
        rate_per_litre DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Deliveries table created/verified');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_deliveries_user_month 
      ON deliveries(user_id, month_year);
      
      CREATE INDEX IF NOT EXISTS idx_deliveries_date 
      ON deliveries(delivery_date);
      
      CREATE INDEX IF NOT EXISTS idx_customers_user 
      ON customers(user_id);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_user_date_customer
      ON deliveries(user_id, delivery_date, COALESCE(customer_id, 0));
    `);
    console.log('✅ Indexes created/verified');

    // Run migrations to add missing columns
    await runMigrations();

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};
