import { Request, Response } from 'express';
import { query } from '../db/pool';
import { User, Delivery, Customer, ExportData, ApiResponse } from '../types';
import { Parser } from 'json2csv';

const unauthorized = (res: Response): void => {
  res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
};

export const exportAsJSON = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) return unauthorized(res);

    const userResult = await query<User>(
      `SELECT id, username, fullname, address, created_at FROM users WHERE id = $1`,
      [userId]
    );

    const deliveriesResult = await query<Delivery>(
      `SELECT * FROM deliveries WHERE user_id = $1 ORDER BY delivery_date DESC`,
      [userId]
    );

    const customersResult = await query<Customer>(
      `SELECT * FROM customers WHERE user_id = $1 ORDER BY name ASC`,
      [userId]
    );

    const exportData: ExportData = {
      user: userResult.rows[0],
      deliveries: deliveriesResult.rows,
      customers: customersResult.rows,
      exported_at: new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: exportData } as ApiResponse<ExportData>);
  } catch (error) {
    console.error('Error in exportAsJSON:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const exportAsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    const username = req.authUser?.username;
    if (!userId || !username) return unauthorized(res);

    const deliveriesResult = await query(
      `SELECT
         d.id,
         d.delivery_date,
         c.name as customer_name,
         d.quantity,
         d.status,
         d.rate_per_litre,
         d.month_year,
         c.contact as customer_contact
       FROM deliveries d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.user_id = $1
       ORDER BY d.delivery_date DESC`,
      [userId]
    );

    const parser = new Parser({
      fields: [
        'id',
        'delivery_date',
        'customer_name',
        'quantity',
        'status',
        'rate_per_litre',
        'month_year',
        'customer_contact',
      ],
    });
    const csv = parser.parse(deliveriesResult.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=milk-data-${username}-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error in exportAsCSV:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const importFromJSON = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) return unauthorized(res);

    const { deliveries, customers } = req.body as {
      deliveries: any[];
      customers?: any[];
    };

    let imported = 0;
    let updated = 0;
    let errors = 0;

    if (Array.isArray(customers)) {
      for (const customer of customers) {
        try {
          const existing = await query(
            `SELECT id FROM customers WHERE user_id = $1 AND name = $2`,
            [userId, customer.name]
          );

          if (existing.rows.length > 0) {
            await query(
              `UPDATE customers
               SET address = $1, contact = $2, rate_per_litre = $3, updated_at = NOW()
               WHERE id = $4 AND user_id = $5`,
              [
                customer.address || null,
                customer.contact || null,
                customer.rate_per_litre,
                existing.rows[0].id,
                userId,
              ]
            );
            updated++;
          } else {
            await query(
              `INSERT INTO customers (user_id, name, address, contact, rate_per_litre)
               VALUES ($1, $2, $3, $4, $5)`,
              [userId, customer.name, customer.address || null, customer.contact || null, customer.rate_per_litre]
            );
            imported++;
          }
        } catch (err) {
          console.error('Error importing customer:', err);
          errors++;
        }
      }
    }

    for (const delivery of deliveries) {
      try {
        const existing = await query(
          `SELECT id FROM deliveries
           WHERE user_id = $1
             AND delivery_date = $2
             AND COALESCE(customer_id, 0) = COALESCE($3, 0)`,
          [userId, delivery.delivery_date, delivery.customer_id || null]
        );

        if (existing.rows.length > 0) {
          await query(
            `UPDATE deliveries
             SET quantity = $1, status = $2, rate_per_litre = $3, customer_id = $4, month_year = $5, updated_at = NOW()
             WHERE id = $6 AND user_id = $7`,
            [
              delivery.quantity,
              delivery.status,
              delivery.rate_per_litre || null,
              delivery.customer_id || null,
              delivery.month_year,
              existing.rows[0].id,
              userId,
            ]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO deliveries
             (user_id, customer_id, delivery_date, quantity, status, month_year, rate_per_litre)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              userId,
              delivery.customer_id || null,
              delivery.delivery_date,
              delivery.quantity,
              delivery.status,
              delivery.month_year,
              delivery.rate_per_litre || null,
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
      message: `Import completed: ${imported} created, ${updated} updated, ${errors} errors`,
    } as ApiResponse);
  } catch (error) {
    console.error('Error in importFromJSON:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
