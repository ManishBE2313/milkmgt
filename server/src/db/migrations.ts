import { pool } from './pool';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');

    // Check if customer_id column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='deliveries' AND column_name='customer_id';
    `;
    
    const columnExists = await pool.query(checkColumnQuery);

    if (columnExists.rows.length === 0) {
      console.log('⚙️ Adding customer_id column to deliveries table...');
      
      // Add customer_id column
      await pool.query(`
        ALTER TABLE deliveries 
        ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
      `);

      // Create index for better performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_deliveries_customer 
        ON deliveries(customer_id);
      `);

      console.log('✅ customer_id column added successfully');
    } else {
      console.log('✅ customer_id column already exists');
    }

    console.log('🎉 Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
};
