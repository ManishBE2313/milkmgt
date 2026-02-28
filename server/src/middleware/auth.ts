import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { verifyAuthToken } from '../utils/auth';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header',
    } as ApiResponse);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAuthToken(token);
    req.authUser = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    } as ApiResponse);
  }
};
