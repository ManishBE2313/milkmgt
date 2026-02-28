import { Request, Response } from 'express';
import { query } from '../db/pool';
import { ApiResponse } from '../types';

interface CustomerDeliveryHistory {
  customer_id: number;
  customer_name: string;
  period: string;
  deliveries: Array<{
    id: number;
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
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const customerId = Number(req.params.customerId);
    const monthYear = req.query.month_year as string | undefined;

    const customerResult = await query<{ name: string; rate_per_litre: string }>(
      `SELECT name, rate_per_litre FROM customers WHERE id = $1 AND user_id = $2`,
      [customerId, userId]
    );

    if (customerResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' } as ApiResponse);
      return;
    }

    const customer = customerResult.rows[0];

    let deliveriesQuery = `
      SELECT id, delivery_date, quantity, status, rate_per_litre
      FROM deliveries
      WHERE user_id = $1 AND customer_id = $2
    `;
    const params: any[] = [userId, customerId];
    if (monthYear) {
      deliveriesQuery += ` AND month_year = $3`;
      params.push(monthYear);
    }
    deliveriesQuery += ` ORDER BY delivery_date DESC`;

    const deliveriesResult = await query(deliveriesQuery, params);

    let totalLitres = 0;
    let totalAmount = 0;
    let deliveredDays = 0;
    let absentDays = 0;
    let rateSum = 0;
    let rateCount = 0;

    const deliveries = deliveriesResult.rows.map((row: any) => {
      const quantity = parseFloat(row.quantity || 0);
      if (row.status === 'delivered') {
        const rate = row.rate_per_litre
          ? parseFloat(row.rate_per_litre)
          : parseFloat(customer.rate_per_litre);
        const amount = quantity * rate;
        totalLitres += quantity;
        totalAmount += amount;
        deliveredDays++;
        if (rate > 0) {
          rateSum += rate;
          rateCount++;
        }
        return {
          id: row.id,
          date: row.delivery_date,
          quantity,
          rate,
          amount,
          status: row.status,
        };
      }
      if (row.status === 'absent') {
        absentDays++;
      }
      return {
        id: row.id,
        date: row.delivery_date,
        quantity: 0,
        rate: 0,
        amount: 0,
        status: row.status,
      };
    });

    const history: CustomerDeliveryHistory = {
      customer_id: customerId,
      customer_name: customer.name,
      period: monthYear || 'all',
      deliveries,
      summary: {
        total_litres: totalLitres,
        total_delivered_days: deliveredDays,
        total_absent_days: absentDays,
        total_amount: totalAmount,
        average_rate: rateCount > 0 ? rateSum / rateCount : parseFloat(customer.rate_per_litre),
      },
    };

    res.status(200).json({ success: true, data: history } as ApiResponse);
  } catch (error) {
    console.error('Error in getCustomerDeliveryHistory:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
