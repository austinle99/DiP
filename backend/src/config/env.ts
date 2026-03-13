import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // ML service URLs — optional for Vercel (services run separately)
  FORECAST_SERVICE_URL: z.string().optional(),
  OPTIMIZER_SERVICE_URL: z.string().optional(),
  ANALYTICS_SERVICE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
