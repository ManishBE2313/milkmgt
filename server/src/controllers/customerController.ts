import { Request, Response } from 'express';
import { query } from '../db/pool';
import { Customer, ApiResponse } from '../types';

const getAuthUserId = (req: Request): number | null => req.authUser?.userId ?? null;

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const result = await query<Customer>(
      `SELECT * FROM customers WHERE user_id = $1 ORDER BY name ASC`,
      [userId]
    );

    res.status(200).json({ success: true, data: result.rows } as ApiResponse<Customer[]>);
  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { name, address, contact, rate_per_litre } = req.body;

    const existing = await query<Customer>(
      `SELECT id FROM customers WHERE user_id = $1 AND name = $2`,
      [userId, name]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'Customer with this name already exists',
      } as ApiResponse);
      return;
    }

    const result = await query<Customer>(
      `INSERT INTO customers (user_id, name, address, contact, rate_per_litre)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, address || null, contact || null, rate_per_litre]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer created successfully',
    } as ApiResponse<Customer>);
  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const customerId = Number(req.params.customerId);
    const updateData = req.body as {
      name?: string;
      address?: string;
      contact?: string;
      rate_per_litre?: number;
    };

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updateData.name);
    }
    if (updateData.address !== undefined) {
      fields.push(`address = $${idx++}`);
      values.push(updateData.address);
    }
    if (updateData.contact !== undefined) {
      fields.push(`contact = $${idx++}`);
      values.push(updateData.contact);
    }
    if (updateData.rate_per_litre !== undefined) {
      fields.push(`rate_per_litre = $${idx++}`);
      values.push(updateData.rate_per_litre);
    }
    fields.push('updated_at = NOW()');
    values.push(userId, customerId);

    const result = await query<Customer>(
      `UPDATE customers
       SET ${fields.join(', ')}
       WHERE user_id = $${idx++} AND id = $${idx}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Customer updated successfully',
    } as ApiResponse<Customer>);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const customerId = Number(req.params.customerId);

    const result = await query<Customer>(
      `DELETE FROM customers WHERE user_id = $1 AND id = $2 RETURNING *`,
      [userId, customerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
