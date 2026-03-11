import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as customerService from '../services/customer.service.js';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const data = await customerService.getCustomers();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:customerId', requireAuth, async (req, res, next) => {
  try {
    const customerId = req.params.customerId as string;
    const data = await customerService.getCustomerDetail(customerId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
