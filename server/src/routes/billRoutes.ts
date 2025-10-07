import express from 'express';
import { generateBillData } from '../controllers/billController';

const router = express.Router();

// GET /api/bill/:username - Generate bill data
router.get('/:username', generateBillData);

export default router;
