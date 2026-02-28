import { Request, Response } from 'express';
import { query } from '../db/pool';
import { MonthlySummary, MonthlyReport, AnalyticsData, ApiResponse } from '../types';

const unauthorized = (res: Response): void => {
  res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
};

export const getMonthlySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) return unauthorized(res);

    const { month } = req.params;

    const result = await query(
      `SELECT
         month_year,
         SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_litres,
         COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered_days,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absent_days,
         AVG(rate_per_litre) as average_rate
       FROM deliveries
       WHERE user_id = $1 AND month_year = $2
       GROUP BY month_year`,
      [userId, month]
    );

    if (result.rows.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          month_year: month,
          total_litres: 0,
          total_delivered_days: 0,
          total_absent_days: 0,
          average_rate: 0,
          total_bill: 0,
        },
      } as ApiResponse<MonthlySummary>);
      return;
    }

    const row = result.rows[0];
    const totalLitres = parseFloat(row.total_litres) || 0;
    const averageRate = parseFloat(row.average_rate) || 0;
    const summary: MonthlySummary = {
      month_year: row.month_year,
      total_litres: totalLitres,
      total_delivered_days: parseInt(row.total_delivered_days, 10) || 0,
      total_absent_days: parseInt(row.total_absent_days, 10) || 0,
      average_rate: averageRate,
      total_bill: parseFloat((totalLitres * averageRate).toFixed(2)),
    };

    res.status(200).json({ success: true, data: summary } as ApiResponse<MonthlySummary>);
  } catch (error) {
    console.error('Error in getMonthlySummary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const getAnalyticsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) return unauthorized(res);

    const trendsResult = await query(
      `SELECT
         month_year,
         SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_litres,
         COUNT(*) as total_days,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
         AVG(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as average_daily_delivery
       FROM deliveries
       WHERE user_id = $1
       GROUP BY month_year
       ORDER BY month_year ASC`,
      [userId]
    );

    const monthlyTrends: MonthlyReport[] = trendsResult.rows.map((row: any) => ({
      month_year: row.month_year,
      total_litres: parseFloat(row.total_litres) || 0,
      total_days: parseInt(row.total_days, 10) || 0,
      absent_days: parseInt(row.absent_days, 10) || 0,
      average_daily_delivery: parseFloat(row.average_daily_delivery) || 0,
    }));

    const statsResult = await query(
      `SELECT
         COUNT(*) as total_deliveries,
         SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_litres
       FROM deliveries
       WHERE user_id = $1`,
      [userId]
    );
    const stats = statsResult.rows[0];

    const analyticsData: AnalyticsData = {
      monthly_trends: monthlyTrends,
      total_deliveries: parseInt(stats.total_deliveries, 10) || 0,
      total_litres: parseFloat(stats.total_litres) || 0,
    };

    res.status(200).json({ success: true, data: analyticsData } as ApiResponse<AnalyticsData>);
  } catch (error) {
    console.error('Error in getAnalyticsReport:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const updateMonthlyRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) return unauthorized(res);

    const { month } = req.params;
    const { rate_per_litre } = req.body;

    const result = await query(
      `UPDATE deliveries
       SET rate_per_litre = $1, updated_at = NOW()
       WHERE user_id = $2 AND month_year = $3
       RETURNING id`,
      [rate_per_litre, userId, month]
    );

    res.status(200).json({
      success: true,
      data: { updated_rows: result.rowCount || 0 },
      message: `Rate updated for ${result.rowCount || 0} deliveries`,
    } as ApiResponse);
  } catch (error) {
    console.error('Error in updateMonthlyRate:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
