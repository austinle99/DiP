import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import portfolioRouter from './routes/portfolio.js';
import commodityRouter from './routes/commodity.js';
import customersRouter from './routes/customers.js';
import containersRouter from './routes/containers.js';
import recommendRouter from './routes/recommend.js';
import internalRouter from './routes/internal.js';
import mlRouter from './routes/ml.js';

const app = express();

// ─── Security & Parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests', code: 'RATE_LIMIT' } },
  }),
);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/commodity', commodityRouter);
app.use('/api/customers', customersRouter);
app.use('/api/containers', containersRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/ml', mlRouter);

// ─── Internal Routes (service-to-service, no auth) ──────────────────────────
app.use('/api/internal', internalRouter);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
