import { Request, Response } from 'express';
import { query } from '../db/pool';
import { Delivery, ApiResponse } from '../types';

export const createOrUpdateDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const deliveryData = req.body as {
      customer_id?: number;
      delivery_date: string;
      quantity: number;
      status: 'delivered' | 'absent' | 'mixed' | 'no_entry';
      month_year: string;
      rate_per_litre?: number;
    };

    const existingDelivery = await query<Delivery>(
      `SELECT * FROM deliveries
       WHERE user_id = $1
         AND delivery_date = $2
         AND COALESCE(customer_id, 0) = COALESCE($3, 0)`,
      [userId, deliveryData.delivery_date, deliveryData.customer_id || null]
    );

    let result;
    if (existingDelivery.rows.length > 0) {
      result = await query<Delivery>(
        `UPDATE deliveries
         SET quantity = $1,
             status = $2,
             rate_per_litre = $3,
             customer_id = $4,
             month_year = $5,
             updated_at = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [
          deliveryData.quantity || 0,
          deliveryData.status,
          deliveryData.rate_per_litre || null,
          deliveryData.customer_id || null,
          deliveryData.month_year,
          existingDelivery.rows[0].id,
          userId,
        ]
      );
    } else {
      result = await query<Delivery>(
        `INSERT INTO deliveries
         (user_id, customer_id, delivery_date, quantity, status, month_year, rate_per_litre)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          deliveryData.customer_id || null,
          deliveryData.delivery_date,
          deliveryData.quantity || 0,
          deliveryData.status,
          deliveryData.month_year,
          deliveryData.rate_per_litre || null,
        ]
      );
    }

    res.status(existingDelivery.rows.length > 0 ? 200 : 201).json({
      success: true,
      data: result.rows[0],
      message: existingDelivery.rows.length > 0 ? 'Delivery updated successfully' : 'Delivery created successfully',
    } as ApiResponse<Delivery>);
  } catch (error) {
    console.error('Error in createOrUpdateDelivery:', error);
    if ((error as any)?.code === '23505') {
      res.status(409).json({
        success: false,
        error: 'Delivery already exists for this date and customer',
      } as ApiResponse);
      return;
    }
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const getDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const monthYear = req.query.month_year as string | undefined;
    let queryText = `
      SELECT d.*, c.name as customer_name
      FROM deliveries d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.user_id = $1
    `;
    const params: any[] = [userId];
    if (monthYear) {
      queryText += ` AND d.month_year = $2`;
      params.push(monthYear);
    }
    queryText += ` ORDER BY d.delivery_date DESC, d.id DESC`;

    const result = await query<Delivery>(queryText, params);
    res.status(200).json({ success: true, data: result.rows } as ApiResponse<Delivery[]>);
  } catch (error) {
    console.error('Error in getDeliveries:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const deleteDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const deliveryId = Number(req.params.id);
    const result = await query<Delivery>(
      `DELETE FROM deliveries WHERE id = $1 AND user_id = $2 RETURNING *`,
      [deliveryId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Delivery not found' } as ApiResponse);
      return;
    }

    res.status(200).json({ success: true, message: 'Delivery deleted successfully' } as ApiResponse);
  } catch (error) {
    console.error('Error in deleteDelivery:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
