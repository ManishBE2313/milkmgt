import { Router } from 'express';
import { 
  getMonthlySummary, 
  getAnalyticsReport,
  updateMonthlyRate 
} from '../controllers/summaryController';

const router = Router();

// GET /api/summary/:username/:month - Get monthly summary
// Example: /api/summary/john123/2025-10
router.get('/:username/:month', getMonthlySummary);

// GET /api/report/:username - Get analytics report with trends
router.get('/:username', getAnalyticsReport);

// PUT /api/summary/:username/:month/rate - Update monthly rate
router.put('/:username/:month/rate', updateMonthlyRate);

export default router;
