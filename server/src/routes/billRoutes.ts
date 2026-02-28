import express from 'express';
import { generateBillData } from '../controllers/billController';
import { requireAuth } from '../middleware/auth';
import { validateBillQuery } from '../middleware/validator';

const router = express.Router();

router.use(requireAuth);
router.get('/', validateBillQuery, generateBillData);

export default router;
