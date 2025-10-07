import express from 'express';
import {
  getCustomersByUsername,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';

const router = express.Router();

// GET /api/customers/:username - Get all customers for user
router.get('/:username', getCustomersByUsername);

// POST /api/customers/:username - Create new customer
router.post('/:username', createCustomer);

// PUT /api/customers/:username/:customerId - Update customer
router.put('/:username/:customerId', updateCustomer);

// DELETE /api/customers/:username/:customerId - Delete customer
router.delete('/:username/:customerId', deleteCustomer);

export default router;
