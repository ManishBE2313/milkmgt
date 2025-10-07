import { Request, Response } from 'express';
import { query } from '../db/pool';
import { User, CreateUserInput, ApiResponse } from '../types';

// Create or get existing user
export const createOrGetUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, fullname, address }: CreateUserInput = req.body;

    // Validate input
    if (!username || !fullname || !address) {
      res.status(400).json({
        success: false,
        error: 'Username, fullname, and address are required'
      } as ApiResponse);
      return;
    }

    // Check if user already exists
    const existingUserQuery = `
      SELECT * FROM users 
      WHERE username = $1 AND fullname = $2 AND address = $3
    `;
    
    const existingUser = await query<User>(
      existingUserQuery,
      [username, fullname, address]
    );

    if (existingUser.rows.length > 0) {
      // User exists, return existing user
      res.status(200).json({
        success: true,
        data: existingUser.rows[0],
        message: 'User found'
      } as ApiResponse<User>);
      return;
    }

    // Create new user
    const insertUserQuery = `
      INSERT INTO users (username, fullname, address)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const newUser = await query<User>(
      insertUserQuery,
      [username, fullname, address]
    );

    res.status(201).json({
      success: true,
      data: newUser.rows[0],
      message: 'User created successfully'
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error in createOrGetUser:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get user by username
export const getUserByUsername = async (
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

    const getUserQuery = `
      SELECT * FROM users WHERE username = $1
    `;

    const result = await query<User>(getUserQuery, [username]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error in getUserByUsername:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get user by ID
export const getUserById = async (userId: number): Promise<User | null> => {
  try {
    const getUserQuery = `SELECT * FROM users WHERE id = $1`;
    const result = await query<User>(getUserQuery, [userId]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
};
