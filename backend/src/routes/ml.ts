/**
 * ML proxy routes.
 * The Express gateway forwards AI/ML requests to the Python microservices
 * and returns their responses to the frontend.
 *
 * When ML service URLs are not configured (e.g. Vercel deployment without
 * the Python services), endpoints return a 503 Service Unavailable response.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const FORECAST_URL = env.FORECAST_SERVICE_URL;
const OPTIMIZER_URL = env.OPTIMIZER_SERVICE_URL;
const ANALYTICS_URL = env.ANALYTICS_SERVICE_URL;

function serviceUnavailable(serviceName: string) {
  return (_req: Request, res: Response) => {
    res.status(503).json({
      error: {
        message: `${serviceName} service is not configured. Deploy the Python microservices separately and set the service URL environment variable.`,
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  };
}

async function proxyPost(serviceUrl: string, path: string, body: unknown) {
  const res = await fetch(`${serviceUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Service error' }));
    const error = new Error(err.detail ?? `ML service returned ${res.status}`);
    (error as Error & { statusCode: number }).statusCode = res.status;
    throw error;
  }

  return res.json();
}

async function proxyGet(serviceUrl: string, path: string) {
  const res = await fetch(`${serviceUrl}${path}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Service error' }));
    const error = new Error(err.detail ?? `ML service returned ${res.status}`);
    (error as Error & { statusCode: number }).statusCode = res.status;
    throw error;
  }

  return res.json();
}

const router = Router();

// ─── Forecasting ─────────────────────────────────────────────────────────────

if (FORECAST_URL) {
  router.post('/forecast/predict', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await proxyPost(FORECAST_URL, '/predict', {
        customer_id: req.body.customerId,
        horizon_months: req.body.horizonMonths ?? 6,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/forecast/batch', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await proxyPost(FORECAST_URL, '/predict/batch', {
        customer_ids: req.body.customerIds,
        horizon_months: req.body.horizonMonths ?? 6,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });
} else {
  router.post('/forecast/predict', requireAuth, serviceUnavailable('Forecast'));
  router.post('/forecast/batch', requireAuth, serviceUnavailable('Forecast'));
}

// ─── Container Optimization ──────────────────────────────────────────────────

if (OPTIMIZER_URL) {
  router.post('/optimize/container', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await proxyPost(OPTIMIZER_URL, '/optimize', {
        customer_id: req.body.customerId,
        sku_list: req.body.skuList.map((s: { skuId: string; quantity: number; weightKg?: number; volumeCbm?: number }) => ({
          sku_id: s.skuId,
          quantity: s.quantity,
          weight_kg: s.weightKg ?? 15.0,
          volume_cbm: s.volumeCbm ?? 0.04,
        })),
        prefer_single: req.body.preferSingle ?? true,
      });

      res.json({
        recommendationId: data.recommendation_id,
        recommendationType: data.recommendation_type,
        containerType: data.container_type,
        utilizationPercent: data.utilization_percent,
        containers: data.containers,
        totalContainers: data.total_containers,
        reasonCodes: data.reason_codes,
        confidenceLabel: data.confidence_label,
        sparseDataMode: data.sparse_data_mode,
        solverStatus: data.solver_status,
      });
    } catch (err) {
      next(err);
    }
  });
} else {
  router.post('/optimize/container', requireAuth, serviceUnavailable('Optimizer'));
}

// ─── Lead Scoring ────────────────────────────────────────────────────────────

if (ANALYTICS_URL) {
  router.post('/score/lead', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await proxyPost(ANALYTICS_URL, '/score/lead', {
        lead_id: req.body.leadId,
        forecast_horizon: req.body.forecastHorizon ?? '30_DAYS',
      });

      res.json({
        score: data.score,
        nextBestAction: data.next_best_action,
        topDrivers: data.top_drivers,
        reasonCodes: data.reason_codes,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/score/potential', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await proxyPost(ANALYTICS_URL, '/score/potential', {
        customer_id: req.body.customerId,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/portfolio/analytics', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await proxyGet(ANALYTICS_URL, '/portfolio');
      res.json(data);
    } catch (err) {
      next(err);
    }
  });
} else {
  router.post('/score/lead', requireAuth, serviceUnavailable('Analytics'));
  router.post('/score/potential', requireAuth, serviceUnavailable('Analytics'));
  router.get('/portfolio/analytics', requireAuth, serviceUnavailable('Analytics'));
}

// ─── Service Health ──────────────────────────────────────────────────────────

router.get('/health', async (_req: Request, res: Response) => {
  const services = [
    { name: 'forecast', url: FORECAST_URL },
    { name: 'optimizer', url: OPTIMIZER_URL },
    { name: 'analytics', url: ANALYTICS_URL },
  ];

  const checks = await Promise.allSettled(
    services.map(async (svc) => {
      if (!svc.url) return { status: 'not_configured' };
      const r = await fetch(`${svc.url}/health`);
      return r.json();
    }),
  );

  const result: Record<string, unknown> = {};
  services.forEach((svc, i) => {
    const c = checks[i];
    result[svc.name] = c.status === 'fulfilled' ? c.value : { status: 'unavailable' };
  });

  res.json(result);
});

export default router;
