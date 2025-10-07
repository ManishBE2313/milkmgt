import { Request, Response } from 'express';
import { query } from '../db/pool';
import { Delivery, CreateDeliveryInput, ApiResponse } from '../types';

// Get all deliveries for a user
export const getDeliveriesByUsername = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { month_year } = req.query;

    if (!username) {
      res.status(400).json({
        success: false,
        error: 'Username is required'
      } as ApiResponse);
      return;
    }

    let queryText = `
      SELECT d.* FROM deliveries d
      INNER JOIN users u ON d.user_id = u.id
      WHERE u.username = $1
    `;
    
    const queryParams: any[] = [username];

    if (month_year) {
      queryText += ` AND d.month_year = $2`;
      queryParams.push(month_year);
    }

    queryText += ` ORDER BY d.delivery_date DESC`;

    const result = await query<Delivery>(queryText, queryParams);

    res.status(200).json({
      success: true,
      data: result.rows
    } as ApiResponse<Delivery[]>);

  } catch (error) {
    console.error('Error in getDeliveriesByUsername:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Create or update delivery entry
export const createOrUpdateDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { delivery_date, quantity, status, month_year, rate_per_litre }: CreateDeliveryInput = req.body;

    // Validate input
    if (!delivery_date || status === undefined || !month_year) {
      res.status(400).json({
        success: false,
        error: 'delivery_date, status, and month_year are required'
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

    // Check if delivery already exists for this date
    const checkQuery = `
      SELECT * FROM deliveries 
      WHERE user_id = $1 AND delivery_date = $2
    `;
    const existingDelivery = await query<Delivery>(checkQuery, [userId, delivery_date]);

    if (existingDelivery.rows.length > 0) {
      // Update existing delivery
      const updateQuery = `
        UPDATE deliveries 
        SET quantity = $1, status = $2, rate_per_litre = $3, updated_at = NOW()
        WHERE user_id = $4 AND delivery_date = $5
        RETURNING *
      `;
      
      const result = await query<Delivery>(
        updateQuery,
        [quantity || 0, status, rate_per_litre || null, userId, delivery_date]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Delivery updated successfully'
      } as ApiResponse<Delivery>);
      return;
    }

    // Create new delivery
    const insertQuery = `
      INSERT INTO deliveries 
      (user_id, delivery_date, quantity, status, month_year, rate_per_litre)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await query<Delivery>(
      insertQuery,
      [userId, delivery_date, quantity || 0, status, month_year, rate_per_litre || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Delivery created successfully'
    } as ApiResponse<Delivery>);

  } catch (error) {
    console.error('Error in createOrUpdateDelivery:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Delete a delivery entry
export const deleteDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, date } = req.params;

    if (!username || !date) {
      res.status(400).json({
        success: false,
        error: 'Username and date are required'
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

    // Delete the delivery
    const deleteQuery = `
      DELETE FROM deliveries 
      WHERE user_id = $1 AND delivery_date = $2
      RETURNING *
    `;

    const result = await query<Delivery>(deleteQuery, [userId, date]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Delivery deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error in deleteDelivery:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
