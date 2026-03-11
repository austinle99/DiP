import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as containerService from '../services/container.service.js';

const router = Router();

const filtersSchema = z.object({
  customerId: z.string().optional(),
  tradeLane: z.string().optional(),
  year: z.coerce.number().optional(),
});

router.get('/mix', requireAuth, validate(filtersSchema, 'query'), async (req, res, next) => {
  try {
    const data = await containerService.getContainerMix(req.query as { customerId?: string; tradeLane?: string; year?: number });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
