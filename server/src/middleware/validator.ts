import { Request, Response, NextFunction } from 'express';
import { DeliveryStatus, ApiResponse } from '../types';

// Validate user input
export const validateUserInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username, fullname, address } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Valid username is required'
    } as ApiResponse);
    return;
  }

  if (!fullname || typeof fullname !== 'string' || fullname.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Valid fullname is required'
    } as ApiResponse);
    return;
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Valid address is required'
    } as ApiResponse);
    return;
  }

  next();
};

// Validate delivery input
export const validateDeliveryInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { delivery_date, status, month_year, quantity } = req.body;

  // Validate delivery_date
  if (!delivery_date || !isValidDate(delivery_date)) {
    res.status(400).json({
      success: false,
      error: 'Valid delivery_date (YYYY-MM-DD) is required'
    } as ApiResponse);
    return;
  }

  // Validate status
  const validStatuses: DeliveryStatus[] = ['delivered', 'absent', 'mixed', 'no_entry'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: `Status must be one of: ${validStatuses.join(', ')}`
    } as ApiResponse);
    return;
  }

  // Validate month_year
  if (!month_year || !isValidMonthYear(month_year)) {
    res.status(400).json({
      success: false,
      error: 'Valid month_year (YYYY-MM) is required'
    } as ApiResponse);
    return;
  }

  // Validate quantity
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
    res.status(400).json({
      success: false,
      error: 'Quantity must be a non-negative number'
    } as ApiResponse);
    return;
  }

  next();
};

// Helper function to validate date format (YYYY-MM-DD)
const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Helper function to validate month-year format (YYYY-MM)
const isValidMonthYear = (monthYear: string): boolean => {
  const regex = /^\d{4}-\d{2}$/;
  return regex.test(monthYear);
};

// Validate username parameter
export const validateUsername = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username } = req.params;

  if (!username || username.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Username parameter is required'
    } as ApiResponse);
    return;
  }

  next();
};
