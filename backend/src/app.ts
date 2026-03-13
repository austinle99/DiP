import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
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

export default app;
