import { Router } from 'express';
import {
  getMonthlySummary,
  getAnalyticsReport,
  updateMonthlyRate,
} from '../controllers/summaryController';
import { requireAuth } from '../middleware/auth';
import { validateMonthParam, validateMonthlyRateUpdate } from '../middleware/validator';

const router = Router();

router.use(requireAuth);

router.get('/report', getAnalyticsReport);
router.get('/:month', validateMonthParam, getMonthlySummary);
router.put('/:month/rate', validateMonthParam, validateMonthlyRateUpdate, updateMonthlyRate);

export default router;
