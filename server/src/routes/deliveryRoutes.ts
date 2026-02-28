import { Router } from 'express';
import {
  getDeliveries,
  createOrUpdateDelivery,
  deleteDelivery,
} from '../controllers/deliveryController';
import { requireAuth } from '../middleware/auth';
import {
  validateDeliveryInput,
  validateIdParam,
  validateMonthQuery,
} from '../middleware/validator';

const router = Router();

router.use(requireAuth);

router.get('/', validateMonthQuery, getDeliveries);
router.post('/', validateDeliveryInput, createOrUpdateDelivery);
router.delete('/:id', validateIdParam, deleteDelivery);

export default router;
