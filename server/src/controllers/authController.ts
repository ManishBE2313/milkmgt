import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool';
import { ApiResponse, User } from '../types';
import { signAuthToken } from '../utils/auth';

type AuthUserRow = User & { password_hash: string };

const toSafeUser = (user: AuthUserRow): User => ({
  id: user.id,
  username: user.username,
  fullname: user.fullname,
  address: user.address,
  created_at: user.created_at,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, fullname, address, password } = req.body;

    const existing = await query<AuthUserRow>(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'Username already exists',
      } as ApiResponse);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await query<AuthUserRow>(
      `INSERT INTO users (username, fullname, address, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username, fullname, address, passwordHash]
    );

    const user = toSafeUser(created.rows[0]);
    const token = signAuthToken({ userId: user.id, username: user.username });

    res.status(201).json({
      success: true,
      data: { user, token },
      message: 'Registration successful',
    } as ApiResponse<{ user: User; token: string }>);
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const result = await query<AuthUserRow>(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      } as ApiResponse);
      return;
    }

    const userRow = result.rows[0];
    if (!userRow.password_hash) {
      res.status(400).json({
        success: false,
        error: 'Legacy account found. Please re-register this username with password.',
      } as ApiResponse);
      return;
    }

    const validPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      } as ApiResponse);
      return;
    }

    const user = toSafeUser(userRow);
    const token = signAuthToken({ userId: user.id, username: user.username });

    res.status(200).json({
      success: true,
      data: { user, token },
      message: 'Login successful',
    } as ApiResponse<{ user: User; token: string }>);
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
};
