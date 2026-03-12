import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as commodityService from '../services/commodity.service.js';

const router = Router();

router.get('/dashboard', requireAuth, async (_req, res, next) => {
  try {
    const data = await commodityService.getCommodityDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:code', requireAuth, async (req, res, next) => {
  try {
    const code = req.params.code as string;
    const data = await commodityService.getCommodityDetail(code);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
