import { Request, Response } from 'express';
import { query } from '../db/pool';
import { ApiResponse, User } from '../types';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.authUser) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const result = await query<User>(
      `SELECT id, username, fullname, address, created_at FROM users WHERE id = $1`,
      [req.authUser.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
};
