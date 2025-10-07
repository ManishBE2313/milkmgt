import { Request, Response } from 'express';
import { query } from '../db/pool';
import { ApiResponse } from '../types';

interface BillData {
  customer_name: string;
  period_start: string;
  period_end: string;
  deliveries: Array<{
    date: string;
    quantity: number;
    rate: number;
    amount: number;
    status: string;
  }>;
  absent_days: Array<{
    date: string;
  }>;
  summary: {
    total_litres: number;
    total_delivered_days: number;
    total_absent_days: number;
    average_rate: number;
    total_amount: number;
  };
}

export const generateBillData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { customer_id, period_start, period_end } = req.query;

    console.log('Bill generation params:', { username, customer_id, period_start, period_end });

    if (!period_start || !period_end) {
      res.status(400).json({
        success: false,
        error: 'Period start and end dates are required'
      } as ApiResponse);
      return;
    }

    // Get user_id
    const userQuery = `SELECT id, fullname, address FROM users WHERE username = $1`;
    const userResult = await query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    const user = userResult.rows[0];
    console.log('User found:', user.id);

    // Build query based on customer filter
    let deliveriesQuery = `
      SELECT 
        d.delivery_date,
        d.quantity,
        d.status,
        d.rate_per_litre as delivery_rate,
        c.name as customer_name,
        c.rate_per_litre as customer_rate
      FROM deliveries d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.user_id = $1 
        AND d.delivery_date >= $2 
        AND d.delivery_date <= $3
    `;

    const queryParams: any[] = [user.id, period_start, period_end];

    // Add customer filter if specified
    if (customer_id && customer_id !== 'all') {
      deliveriesQuery += ` AND d.customer_id = $4`;
      queryParams.push(customer_id);
      console.log('Filtering by customer_id:', customer_id);
    } else {
      console.log('Fetching all customers');
    }

    deliveriesQuery += ` ORDER BY d.delivery_date ASC`;

    console.log('Executing query with params:', queryParams);
    const deliveriesResult = await query(deliveriesQuery, queryParams);
    console.log('Deliveries found:', deliveriesResult.rows.length);

    // Get customer name if specific customer selected
    let customerName = 'All Customers';
    if (customer_id && customer_id !== 'all') {
      const customerQuery = `SELECT name FROM customers WHERE id = $1`;
      const customerResult = await query(customerQuery, [customer_id]);
      if (customerResult.rows.length > 0) {
        customerName = customerResult.rows[0].name;
      }
    }

    // Process deliveries
    const deliveries: any[] = [];
    const absentDays: any[] = [];
    let totalLitres = 0;
    let totalAmount = 0;
    let deliveredDays = 0;
    let absentDaysCount = 0;
    let rateSum = 0;
    let rateCount = 0;

    console.log('Processing deliveries...');

    deliveriesResult.rows.forEach((row: any) => {
      console.log('Processing row:', {
        date: row.delivery_date,
        status: row.status,
        quantity: row.quantity,
        delivery_rate: row.delivery_rate,
        customer_rate: row.customer_rate
      });

      if (row.status === 'delivered') {
        // Determine rate: use delivery rate if set, else customer rate, else 0
        const rate = row.delivery_rate 
          ? parseFloat(row.delivery_rate) 
          : (row.customer_rate ? parseFloat(row.customer_rate) : 0);
        
        const quantity = parseFloat(row.quantity || 0);
        const amount = quantity * rate;

        console.log('Delivered:', { quantity, rate, amount });
        
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
        absentDays.push({
          date: row.delivery_date
        });
        absentDaysCount++;
      }
    });

    console.log('Summary calculated:', {
      totalLitres,
      totalAmount,
      deliveredDays,
      absentDaysCount
    });

    const billData: BillData = {
      customer_name: customerName,
      period_start: period_start as string,
      period_end: period_end as string,
      deliveries,
      absent_days: absentDays,
      summary: {
        total_litres: totalLitres,
        total_delivered_days: deliveredDays,
        total_absent_days: absentDaysCount,
        average_rate: rateCount > 0 ? rateSum / rateCount : 0,
        total_amount: totalAmount
      }
    };

    res.status(200).json({
      success: true,
      data: {
        bill: billData,
        user: {
          name: user.fullname,
          address: user.address
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error in generateBillData:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
