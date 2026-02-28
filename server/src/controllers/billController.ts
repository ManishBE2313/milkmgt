import { Request, Response } from 'express';
import { query } from '../db/pool';
import { ApiResponse } from '../types';

interface BillData {
  customer_name: string;
  customer_address: string | null;
  customer_contact: string | null;
  period_start: string;
  period_end: string;
  deliveries: Array<{
    date: string;
    quantity: number;
    rate: number;
    amount: number;
    status: string;
  }>;
  absent_days: Array<{ date: string }>;
  summary: {
    total_litres: number;
    total_delivered_days: number;
    total_absent_days: number;
    average_rate: number;
    total_amount: number;
  };
}

export const generateBillData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { customer_id, period_start, period_end } = req.query as {
      customer_id?: string;
      period_start: string;
      period_end: string;
    };

    const userResult = await query<{ fullname: string; address: string }>(
      `SELECT fullname, address FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
      return;
    }

    let deliveriesQuery: string;
    let params: any[];

    if (customer_id && customer_id !== 'all') {
      deliveriesQuery = `
        SELECT
          d.delivery_date,
          d.quantity,
          d.status,
          d.rate_per_litre as delivery_rate,
          c.name as customer_name,
          c.rate_per_litre as customer_rate,
          c.address as customer_address,
          c.contact as customer_contact
        FROM deliveries d
        INNER JOIN customers c ON d.customer_id = c.id
        WHERE d.user_id = $1 AND d.customer_id = $2
          AND d.delivery_date BETWEEN $3 AND $4
        ORDER BY d.delivery_date ASC`;
      params = [userId, Number(customer_id), period_start, period_end];
    } else {
      deliveriesQuery = `
        SELECT
          d.delivery_date,
          d.quantity,
          d.status,
          d.rate_per_litre as delivery_rate,
          c.name as customer_name,
          c.rate_per_litre as customer_rate,
          c.address as customer_address,
          c.contact as customer_contact
        FROM deliveries d
        LEFT JOIN customers c ON d.customer_id = c.id
        WHERE d.user_id = $1 AND d.delivery_date BETWEEN $2 AND $3
        ORDER BY d.delivery_date ASC`;
      params = [userId, period_start, period_end];
    }

    const deliveriesResult = await query(deliveriesQuery, params);

    let customerName = 'All Customers';
    let customerAddress: string | null = null;
    let customerContact: string | null = null;

    if (customer_id && customer_id !== 'all') {
      const customerResult = await query<{ name: string; address: string | null; contact: string | null }>(
        `SELECT name, address, contact FROM customers WHERE id = $1 AND user_id = $2`,
        [Number(customer_id), userId]
      );
      if (customerResult.rows.length > 0) {
        customerName = customerResult.rows[0].name;
        customerAddress = customerResult.rows[0].address;
        customerContact = customerResult.rows[0].contact;
      }
    }

    const deliveries: BillData['deliveries'] = [];
    const absentDays: BillData['absent_days'] = [];
    let totalLitres = 0;
    let totalAmount = 0;
    let deliveredDays = 0;
    let absentDaysCount = 0;
    let rateSum = 0;
    let rateCount = 0;

    deliveriesResult.rows.forEach((row: any) => {
      if (row.status === 'delivered') {
        const rate = row.delivery_rate
          ? parseFloat(row.delivery_rate)
          : row.customer_rate
            ? parseFloat(row.customer_rate)
            : 0;
        const quantity = parseFloat(row.quantity || 0);
        const amount = quantity * rate;

        deliveries.push({
          date: row.delivery_date,
          quantity,
          rate,
          amount,
          status: row.status,
        });

        totalLitres += quantity;
        totalAmount += amount;
        deliveredDays++;
        if (rate > 0) {
          rateSum += rate;
          rateCount++;
        }
      } else if (row.status === 'absent') {
        absentDays.push({ date: row.delivery_date });
        absentDaysCount++;
      }
    });

    const billData: BillData = {
      customer_name: customerName,
      customer_address: customerAddress,
      customer_contact: customerContact,
      period_start,
      period_end,
      deliveries,
      absent_days: absentDays,
      summary: {
        total_litres: totalLitres,
        total_delivered_days: deliveredDays,
        total_absent_days: absentDaysCount,
        average_rate: rateCount > 0 ? rateSum / rateCount : 0,
        total_amount: totalAmount,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        bill: billData,
        user: {
          name: userResult.rows[0].fullname,
          address: userResult.rows[0].address,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error in generateBillData:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
