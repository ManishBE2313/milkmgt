import { Request, Response } from 'express';
import { query } from '../db/pool';
import { MonthlySummary, MonthlyReport, AnalyticsData, ApiResponse } from '../types';

// Get monthly summary for a user
export const getMonthlySummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, month } = req.params;

    if (!username || !month) {
      res.status(400).json({
        success: false,
        error: 'Username and month (YYYY-MM) are required'
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

    // Calculate monthly summary
    const summaryQuery = `
      SELECT 
        month_year,
        SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_litres,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absent_days,
        AVG(rate_per_litre) as average_rate
      FROM deliveries
      WHERE user_id = $1 AND month_year = $2
      GROUP BY month_year
    `;

    const result = await query(summaryQuery, [userId, month]);

    if (result.rows.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          month_year: month,
          total_litres: 0,
          total_delivered_days: 0,
          total_absent_days: 0,
          average_rate: 0,
          total_bill: 0
        }
      } as ApiResponse<MonthlySummary>);
      return;
    }

    const summary = result.rows[0];
    const totalBill = (parseFloat(summary.total_litres) || 0) * (parseFloat(summary.average_rate) || 0);

    const monthlySummary: MonthlySummary = {
      month_year: summary.month_year,
      total_litres: parseFloat(summary.total_litres) || 0,
      total_delivered_days: parseInt(summary.total_delivered_days) || 0,
      total_absent_days: parseInt(summary.total_absent_days) || 0,
      average_rate: parseFloat(summary.average_rate) || 0,
      total_bill: parseFloat(totalBill.toFixed(2))
    };

    res.status(200).json({
      success: true,
      data: monthlySummary
    } as ApiResponse<MonthlySummary>);

  } catch (error) {
    console.error('Error in getMonthlySummary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get analytics/report data for a user
export const getAnalyticsReport = async (
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

    // Get monthly trends
    const trendsQuery = `
      SELECT 
        month_year,
        SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_litres,
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        AVG(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as average_daily_delivery
      FROM deliveries
      WHERE user_id = $1
      GROUP BY month_year
      ORDER BY month_year ASC
    `;

    const trendsResult = await query(trendsQuery, [userId]);

    const monthlyTrends: MonthlyReport[] = trendsResult.rows.map(row => ({
      month_year: row.month_year,
      total_litres: parseFloat(row.total_litres) || 0,
      total_days: parseInt(row.total_days) || 0,
      absent_days: parseInt(row.absent_days) || 0,
      average_daily_delivery: parseFloat(row.average_daily_delivery) || 0
    }));

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_litres
      FROM deliveries
      WHERE user_id = $1
    `;

    const statsResult = await query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    const analyticsData: AnalyticsData = {
      monthly_trends: monthlyTrends,
      total_deliveries: parseInt(stats.total_deliveries) || 0,
      total_litres: parseFloat(stats.total_litres) || 0
    };

    res.status(200).json({
      success: true,
      data: analyticsData
    } as ApiResponse<AnalyticsData>);

  } catch (error) {
    console.error('Error in getAnalyticsReport:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Update rate for a specific month
export const updateMonthlyRate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, month } = req.params;
    const { rate_per_litre } = req.body;

    if (!username || !month || rate_per_litre === undefined) {
      res.status(400).json({
        success: false,
        error: 'Username, month, and rate_per_litre are required'
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

    // Update rate for all deliveries in the month
    const updateQuery = `
      UPDATE deliveries
      SET rate_per_litre = $1, updated_at = NOW()
      WHERE user_id = $2 AND month_year = $3
      RETURNING *
    `;

    const result = await query(updateQuery, [rate_per_litre, userId, month]);

    res.status(200).json({
      success: true,
      data: result.rows,
      message: `Rate updated for ${result.rowCount} deliveries`
    } as ApiResponse);

  } catch (error) {
    console.error('Error in updateMonthlyRate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
