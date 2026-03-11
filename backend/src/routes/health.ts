import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', latency: Date.now() - start, db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', latency: Date.now() - start, db: 'disconnected' });
  }
});

export default router;
