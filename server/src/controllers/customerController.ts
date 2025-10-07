import { Request, Response } from 'express';
import { query } from '../db/pool';
import { Customer, CreateCustomerInput, UpdateCustomerInput, ApiResponse } from '../types';

// Get all customers for a user
export const getCustomersByUsername = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username) {
      res.status(400).json({
        success: false,
        error: 'Username is required'
      } as ApiResponse);
      return;
    }

    const queryText = `
      SELECT c.* FROM customers c
      INNER JOIN users u ON c.user_id = u.id
      WHERE u.username = $1
      ORDER BY c.name ASC
    `;

    const result = await query<Customer>(queryText, [username]);

    res.status(200).json({
      success: true,
      data: result.rows
    } as ApiResponse<Customer[]>);

  } catch (error) {
    console.error('Error in getCustomersByUsername:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Create customer
export const createCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { name, address, contact, rate_per_litre }: CreateCustomerInput = req.body;

    // Validation
    if (!name || !rate_per_litre) {
      res.status(400).json({
        success: false,
        error: 'Name and rate_per_litre are required'
      } as ApiResponse);
      return;
    }

    // Get user_id from username
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

    // Check if customer with same name exists
    const checkQuery = `SELECT * FROM customers WHERE user_id = $1 AND name = $2`;
    const existingCustomer = await query<Customer>(checkQuery, [userId, name]);

    if (existingCustomer.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Customer with this name already exists'
      } as ApiResponse);
      return;
    }

    // Create customer
    const insertQuery = `
      INSERT INTO customers 
      (user_id, name, address, contact, rate_per_litre)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query<Customer>(
      insertQuery,
      [userId, name, address || null, contact || null, rate_per_litre]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer created successfully'
    } as ApiResponse<Customer>);

  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Update customer
export const updateCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, customerId } = req.params;
    const updateData: UpdateCustomerInput = req.body;

    // Get user_id
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

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updateData.address);
    }
    if (updateData.contact !== undefined) {
      fields.push(`contact = $${paramCount++}`);
      values.push(updateData.contact);
    }
    if (updateData.rate_per_litre !== undefined) {
      fields.push(`rate_per_litre = $${paramCount++}`);
      values.push(updateData.rate_per_litre);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) { // Only updated_at
      res.status(400).json({
        success: false,
        error: 'No fields to update'
      } as ApiResponse);
      return;
    }

    values.push(userId, customerId);

    const updateQuery = `
      UPDATE customers 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount++} AND id = $${paramCount}
      RETURNING *
    `;

    const result = await query<Customer>(updateQuery, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Customer updated successfully'
    } as ApiResponse<Customer>);

  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Delete customer
export const deleteCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, customerId } = req.params;

    // Get user_id
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

    // Delete customer
    const deleteQuery = `
      DELETE FROM customers 
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await query<Customer>(deleteQuery, [userId, customerId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
