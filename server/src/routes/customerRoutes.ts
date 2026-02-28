import express from 'express';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';
import { getCustomerDeliveryHistory } from '../controllers/customerDeliveryController';
import { requireAuth } from '../middleware/auth';
import {
  validateCustomerCreate,
  validateCustomerIdParam,
  validateCustomerUpdate,
  validateMonthQuery,
} from '../middleware/validator';

const router = express.Router();

router.use(requireAuth);

router.get('/', getCustomers);
router.post('/', validateCustomerCreate, createCustomer);
router.put('/:customerId', validateCustomerIdParam, validateCustomerUpdate, updateCustomer);
router.delete('/:customerId', validateCustomerIdParam, deleteCustomer);
router.get(
  '/:customerId/history',
  validateCustomerIdParam,
  validateMonthQuery,
  getCustomerDeliveryHistory
);

export default router;
