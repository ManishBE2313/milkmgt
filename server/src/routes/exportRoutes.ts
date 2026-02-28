import express from 'express';
import { exportAsJSON, exportAsCSV, importFromJSON } from '../controllers/exportController';
import { requireAuth } from '../middleware/auth';
import { validateImportData } from '../middleware/validator';

const router = express.Router();

router.use(requireAuth);

router.get('/json', exportAsJSON);
router.get('/csv', exportAsCSV);
router.post('/import', validateImportData, importFromJSON);

export default router;
