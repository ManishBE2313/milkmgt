import { Router } from 'express';
import { 
  getDeliveriesByUsername, 
  createOrUpdateDelivery, 
  deleteDelivery 
} from '../controllers/deliveryController';

const router = Router();

// GET /api/deliveries/:username - Get all deliveries for a user
// Query params: ?month_year=YYYY-MM (optional)
router.get('/:username', getDeliveriesByUsername);

// POST /api/deliveries/:username - Create or update delivery entry
router.post('/:username', createOrUpdateDelivery);

// DELETE /api/deliveries/:username/:date - Delete a delivery entry
router.delete('/:username/:date', deleteDelivery);

export default router;
