import { Request, Response } from 'express';
import { query } from '../db/pool';
import { ApiResponse } from '../types';

interface CustomerDeliveryHistory {
  customer_id: number;
  customer_name: string;
  period: string;
  deliveries: Array<{
    date: string;
    quantity: number;
    rate: number;
    amount: number;
    status: string;
  }>;
  summary: {
    total_litres: number;
    total_delivered_days: number;
    total_absent_days: number;
    total_amount: number;
    average_rate: number;
  };
}

export const getCustomerDeliveryHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, customerId } = req.params;
    const { month_year } = req.query;

    console.log('📊 Fetching delivery history:', { username, customerId, month_year });

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

    // Get customer info
    const customerQuery = `SELECT name, rate_per_litre FROM customers WHERE id = $1 AND user_id = $2`;
    const customerResult = await query(customerQuery, [customerId, userId]);

    if (customerResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
      return;
    }

    const customer = customerResult.rows[0];

    // Build query for deliveries
    let deliveriesQuery = `
      SELECT 
        delivery_date,
        quantity,
        status,
        rate_per_litre
      FROM deliveries
      WHERE user_id = $1 AND customer_id = $2
    `;

    const queryParams: any[] = [userId, customerId];

    if (month_year) {
      deliveriesQuery += ` AND month_year = $3`;
      queryParams.push(month_year);
    }

    deliveriesQuery += ` ORDER BY delivery_date DESC`;

    const deliveriesResult = await query(deliveriesQuery, queryParams);

    // Process deliveries
    const deliveries: any[] = [];
    let totalLitres = 0;
    let totalAmount = 0;
    let deliveredDays = 0;
    let absentDays = 0;
    let rateSum = 0;
    let rateCount = 0;

    deliveriesResult.rows.forEach((row: any) => {
      if (row.status === 'delivered') {
        const rate = row.rate_per_litre 
          ? parseFloat(row.rate_per_litre) 
          : parseFloat(customer.rate_per_litre);
        const quantity = parseFloat(row.quantity || 0);
        const amount = quantity * rate;

        deliveries.push({
          date: row.delivery_date,
          quantity: quantity,
          rate: rate,
          amount: amount,
          status: row.status
        });

        totalLitres += quantity;
        totalAmount += amount;
        deliveredDays++;
        
        if (rate > 0) {
          rateSum += rate;
          rateCount++;
        }
      } else if (row.status === 'absent') {
        deliveries.push({
          date: row.delivery_date,
          quantity: 0,
          rate: 0,
          amount: 0,
          status: row.status
        });
        absentDays++;
      }
    });

    const history: CustomerDeliveryHistory = {
      customer_id: parseInt(customerId),
      customer_name: customer.name,
      period: month_year as string || 'All Time',
      deliveries,
      summary: {
        total_litres: totalLitres,
        total_delivered_days: deliveredDays,
        total_absent_days: absentDays,
        total_amount: totalAmount,
        average_rate: rateCount > 0 ? rateSum / rateCount : parseFloat(customer.rate_per_litre)
      }
    };

    res.status(200).json({
      success: true,
      data: history
    } as ApiResponse);

  } catch (error) {
    console.error('Error in getCustomerDeliveryHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
