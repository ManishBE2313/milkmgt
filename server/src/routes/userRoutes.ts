import { Router } from 'express';
import { createOrGetUser, getUserByUsername } from '../controllers/userController';

const router = Router();

// POST /api/user - Create or get existing user
router.post('/', createOrGetUser);

// GET /api/user/:username - Get user by username
router.get('/:username', getUserByUsername);

export default router;
