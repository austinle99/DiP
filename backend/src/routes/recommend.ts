import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as recommendationService from '../services/recommendation.service.js';

const router = Router();

const recommendSchema = z.object({
  customerId: z.string().min(1),
  skuList: z.array(
    z.object({
      skuId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ).min(1),
});

router.post('/container', requireAuth, validate(recommendSchema), async (req, res, next) => {
  try {
    const data = await recommendationService.recommendContainer(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
