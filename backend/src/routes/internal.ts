/**
 * Internal routes consumed by Python microservices.
 * These endpoints are NOT exposed to the frontend — only accessible
 * within the Docker network (service-to-service).
 */

import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

// ─── TEU Records for Forecast Service ────────────────────────────────────────
router.get('/teu-records/:customerId', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { externalId: req.params.customerId as string },
      select: { id: true },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const records = await prisma.teuRecord.findMany({
      where: { customerId: customer.id },
      orderBy: { month: 'asc' },
      select: { month: true, bookedTeu: true, forecastTeu: true },
    });

    res.json(records.map((r) => ({
      month: r.month,
      booked_teu: r.bookedTeu,
      forecast_teu: r.forecastTeu,
    })));
  } catch (err) {
    next(err);
  }
});

// ─── Customer Analytics Data ─────────────────────────────────────────────────
router.get('/customer-analytics/:customerId', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { externalId: req.params.customerId as string },
      include: {
        teuRecords: { orderBy: { month: 'asc' }, select: { bookedTeu: true, month: true } },
        bookings: { select: { createdAt: true } },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const totalTeu = customer.teuRecords.reduce((s, r) => s + r.bookedTeu, 0);
    const monthlyTeu = customer.teuRecords.map((r) => r.bookedTeu);
    const lastBooking = customer.bookings.length > 0
      ? customer.bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      : null;
    const recencyDays = lastBooking
      ? Math.floor((Date.now() - lastBooking.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    res.json({
      customer_id: customer.externalId,
      tier: customer.tier,
      total_teu: Math.round(totalTeu),
      monthly_teu: monthlyTeu,
      booking_count: customer.bookings.length,
      recency_days: recencyDays,
    });
  } catch (err) {
    next(err);
  }
});

// ─── All Customers Analytics (for portfolio) ─────────────────────────────────
router.get('/customer-analytics', async (_req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        teuRecords: { orderBy: { month: 'asc' }, select: { bookedTeu: true } },
        bookings: { select: { createdAt: true } },
      },
    });

    const results = customers.map((c) => {
      const totalTeu = c.teuRecords.reduce((s, r) => s + r.bookedTeu, 0);
      const monthlyTeu = c.teuRecords.map((r) => r.bookedTeu);
      const lastBooking = c.bookings.length > 0
        ? c.bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;
      const recencyDays = lastBooking
        ? Math.floor((Date.now() - lastBooking.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      return {
        customer_id: c.externalId,
        tier: c.tier,
        total_teu: Math.round(totalTeu),
        monthly_teu: monthlyTeu,
        booking_count: c.bookings.length,
        recency_days: recencyDays,
      };
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
