import { Request, Response } from 'express';
import { query } from '../db/pool';
import { Delivery, CreateDeliveryInput, ApiResponse } from '../types';

// Create or Update Delivery
export const createOrUpdateDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const deliveryData: CreateDeliveryInput = req.body;

    console.log('📦 Creating/Updating delivery:', {
      username,
      deliveryData,
      customer_id: deliveryData.customer_id // Debug log
    });

    // Validation
    if (!deliveryData.delivery_date || !deliveryData.status) {
      res.status(400).json({
        success: false,
        error: 'Delivery date and status are required'
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

    // Check if delivery already exists
    const checkQuery = `
      SELECT * FROM deliveries 
      WHERE user_id = $1 AND delivery_date = $2
    `;
    const existingDelivery = await query<Delivery>(
      checkQuery,
      [userId, deliveryData.delivery_date]
    );

    let result;

    if (existingDelivery.rows.length > 0) {
      // Update existing delivery
      console.log('♻️ Updating existing delivery, customer_id:', deliveryData.customer_id);
      
      const updateQuery = `
        UPDATE deliveries 
        SET 
          quantity = $1, 
          status = $2, 
          rate_per_litre = $3,
          customer_id = $4,
          updated_at = NOW()
        WHERE user_id = $5 AND delivery_date = $6
        RETURNING *
      `;

      result = await query<Delivery>(
        updateQuery,
        [
          deliveryData.quantity || 0,
          deliveryData.status,
          deliveryData.rate_per_litre || null,
          deliveryData.customer_id || null, // Make sure customer_id is included
          userId,
          deliveryData.delivery_date
        ]
      );

      console.log('✅ Delivery updated, customer_id in DB:', result.rows[0].customer_id);
    } else {
      // Insert new delivery
      console.log('➕ Inserting new delivery, customer_id:', deliveryData.customer_id);
      
      const insertQuery = `
        INSERT INTO deliveries 
        (user_id, customer_id, delivery_date, quantity, status, month_year, rate_per_litre)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      result = await query<Delivery>(
        insertQuery,
        [
          userId,
          deliveryData.customer_id || null, // Make sure customer_id is included
          deliveryData.delivery_date,
          deliveryData.quantity || 0,
          deliveryData.status,
          deliveryData.month_year,
          deliveryData.rate_per_litre || null
        ]
      );

      console.log('✅ Delivery created, customer_id in DB:', result.rows[0].customer_id);
    }

    res.status(existingDelivery.rows.length > 0 ? 200 : 201).json({
      success: true,
      data: result.rows[0],
      message: existingDelivery.rows.length > 0 
        ? 'Delivery updated successfully' 
        : 'Delivery created successfully'
    } as ApiResponse<Delivery>);

  } catch (error) {
    console.error('Error in createOrUpdateDelivery:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get deliveries
export const getDeliveriesByUsername = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { month_year } = req.query;

    let queryText = `
      SELECT d.*, c.name as customer_name FROM deliveries d
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN customers c ON d.customer_id = c.id
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

// Delete delivery
export const deleteDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, date } = req.params;

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

    // Delete delivery
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
