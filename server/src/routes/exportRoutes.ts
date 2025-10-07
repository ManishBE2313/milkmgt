import express from 'express';
import {
  exportAsJSON,
  exportAsCSV,
  importFromJSON
} from '../controllers/exportController';

const router = express.Router();

// GET /api/export/:username/json - Export data as JSON
router.get('/:username/json', exportAsJSON);

// GET /api/export/:username/csv - Export data as CSV
router.get('/:username/csv', exportAsCSV);

// POST /api/import/:username - Import data from JSON
router.post('/:username', importFromJSON);

export default router;
