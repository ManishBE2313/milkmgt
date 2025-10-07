import { Request, Response } from 'express';
import { query } from '../db/pool';
import { User, Delivery, Customer, ExportData, ApiResponse } from '../types';
import { Parser } from 'json2csv';

// Export data as JSON
export const exportAsJSON = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;

    // Get user
    const userQuery = `SELECT * FROM users WHERE username = $1`;
    const userResult = await query<User>(userQuery, [username]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    const user = userResult.rows[0];

    // Get all deliveries
    const deliveriesQuery = `
      SELECT * FROM deliveries 
      WHERE user_id = $1 
      ORDER BY delivery_date DESC
    `;
    const deliveriesResult = await query<Delivery>(deliveriesQuery, [user.id]);

    // Get all customers
    const customersQuery = `
      SELECT * FROM customers 
      WHERE user_id = $1 
      ORDER BY name ASC
    `;
    const customersResult = await query<Customer>(customersQuery, [user.id]);

    const exportData: ExportData = {
      user,
      deliveries: deliveriesResult.rows,
      customers: customersResult.rows,
      exported_at: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: exportData
    } as ApiResponse<ExportData>);

  } catch (error) {
    console.error('Error in exportAsJSON:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Export data as CSV
export const exportAsCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;

    // Get user
    const userQuery = `SELECT * FROM users WHERE username = $1`;
    const userResult = await query<User>(userQuery, [username]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    const user = userResult.rows[0];

    // Get all deliveries with customer info
    const deliveriesQuery = `
      SELECT 
        d.*,
        c.name as customer_name,
        c.contact as customer_contact
      FROM deliveries d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.user_id = $1 
      ORDER BY d.delivery_date DESC
    `;
    const deliveriesResult = await query(deliveriesQuery, [user.id]);

    // Convert to CSV
    const fields = [
      'delivery_date',
      'customer_name',
      'quantity',
      'status',
      'rate_per_litre',
      'month_year',
      'customer_contact'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(deliveriesResult.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=milk-data-${username}-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.status(200).send(csv);

  } catch (error) {
    console.error('Error in exportAsCSV:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Import data from JSON
export const importFromJSON = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { deliveries, customers } = req.body;

    if (!Array.isArray(deliveries)) {
      res.status(400).json({
        success: false,
        error: 'Invalid data format. Expected { deliveries: [], customers: [] }'
      } as ApiResponse);
      return;
    }

    // Get user
    const userQuery = `SELECT id FROM users WHERE username = $1`;
    const userResult = await query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    const userId = userResult.rows[0].id;

    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Import customers first (if provided)
    if (Array.isArray(customers)) {
      for (const customer of customers) {
        try {
          // Check if customer exists
          const checkQuery = `
            SELECT id FROM customers 
            WHERE user_id = $1 AND name = $2
          `;
          const existing = await query(checkQuery, [userId, customer.name]);

          if (existing.rows.length > 0) {
            // Update existing customer
            await query(
              `UPDATE customers 
               SET address = $1, contact = $2, rate_per_litre = $3, updated_at = NOW()
               WHERE user_id = $4 AND name = $5`,
              [customer.address, customer.contact, customer.rate_per_litre, userId, customer.name]
            );
            updated++;
          } else {
            // Insert new customer
            await query(
              `INSERT INTO customers 
               (user_id, name, address, contact, rate_per_litre) 
               VALUES ($1, $2, $3, $4, $5)`,
              [userId, customer.name, customer.address, customer.contact, customer.rate_per_litre]
            );
            imported++;
          }
        } catch (err) {
          console.error('Error importing customer:', err);
          errors++;
        }
      }
    }

    // Import deliveries
    for (const delivery of deliveries) {
      try {
        // Check if delivery exists
        const checkQuery = `
          SELECT id FROM deliveries 
          WHERE user_id = $1 AND delivery_date = $2
        `;
        const existing = await query(checkQuery, [userId, delivery.delivery_date]);

        if (existing.rows.length > 0) {
          // Update existing delivery
          await query(
            `UPDATE deliveries 
             SET quantity = $1, status = $2, rate_per_litre = $3, 
                 customer_id = $4, updated_at = NOW()
             WHERE user_id = $5 AND delivery_date = $6`,
            [
              delivery.quantity,
              delivery.status,
              delivery.rate_per_litre,
              delivery.customer_id,
              userId,
              delivery.delivery_date
            ]
          );
          updated++;
        } else {
          // Insert new delivery
          await query(
            `INSERT INTO deliveries 
             (user_id, customer_id, delivery_date, quantity, status, month_year, rate_per_litre) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              userId,
              delivery.customer_id,
              delivery.delivery_date,
              delivery.quantity,
              delivery.status,
              delivery.month_year,
              delivery.rate_per_litre
            ]
          );
          imported++;
        }
      } catch (err) {
        console.error('Error importing delivery:', err);
        errors++;
      }
    }

    res.status(200).json({
      success: true,
      data: { imported, updated, errors },
      message: `Import completed: ${imported} created, ${updated} updated, ${errors} errors`
    } as ApiResponse);

  } catch (error) {
    console.error('Error in importFromJSON:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
