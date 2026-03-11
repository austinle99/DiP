/**
 * ML proxy routes.
 * The Express gateway forwards AI/ML requests to the Python microservices
 * and returns their responses to the frontend.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const FORECAST_URL = process.env.FORECAST_SERVICE_URL ?? 'http://forecast:8001';
const OPTIMIZER_URL = process.env.OPTIMIZER_SERVICE_URL ?? 'http://optimizer:8002';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL ?? 'http://analytics:8003';

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

router.post('/forecast/predict', requireAuth, async (req, res, next) => {
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

router.post('/forecast/batch', requireAuth, async (req, res, next) => {
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

// ─── Container Optimization ──────────────────────────────────────────────────

router.post('/optimize/container', requireAuth, async (req, res, next) => {
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

    // Transform snake_case response back to camelCase for frontend
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

// ─── Lead Scoring ────────────────────────────────────────────────────────────

router.post('/score/lead', requireAuth, async (req, res, next) => {
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

// ─── Customer Potential ──────────────────────────────────────────────────────

router.post('/score/potential', requireAuth, async (req, res, next) => {
  try {
    const data = await proxyPost(ANALYTICS_URL, '/score/potential', {
      customer_id: req.body.customerId,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Portfolio Analytics ─────────────────────────────────────────────────────

router.get('/portfolio/analytics', requireAuth, async (_req, res, next) => {
  try {
    const data = await proxyGet(ANALYTICS_URL, '/portfolio');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Service Health ──────────────────────────────────────────────────────────

router.get('/health', async (_req, res) => {
  const checks = await Promise.allSettled([
    fetch(`${FORECAST_URL}/health`).then((r) => r.json()),
    fetch(`${OPTIMIZER_URL}/health`).then((r) => r.json()),
    fetch(`${ANALYTICS_URL}/health`).then((r) => r.json()),
  ]);

  const [forecast, optimizer, analytics] = checks.map((c) =>
    c.status === 'fulfilled' ? c.value : { status: 'unavailable' },
  );

  res.json({ forecast, optimizer, analytics });
});

export default router;
