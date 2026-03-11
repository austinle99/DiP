import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as portfolioService from '../services/portfolio.service.js';

const router = Router();

router.get('/overview', requireAuth, async (_req, res, next) => {
  try {
    const data = await portfolioService.getPortfolioOverview();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
