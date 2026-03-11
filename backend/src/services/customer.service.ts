import { prisma } from '../config/db.js';
import { AppError } from '../utils/errors.js';

const tierMap = { TIER_1: 'Tier 1', TIER_2: 'Tier 2', TIER_3: 'Tier 3' } as const;

export async function getCustomers() {
  const customers = await prisma.customer.findMany({
    include: {
      teuRecords: { select: { bookedTeu: true } },
    },
    orderBy: { name: 'asc' },
  });

  return customers.map((c) => ({
    customerId: c.externalId,
    customerName: c.name,
    tier: tierMap[c.tier],
    region: c.region,
    totalTeu: Math.round(c.teuRecords.reduce((sum, r) => sum + r.bookedTeu, 0)),
  }));
}

export async function getCustomerDetail(externalId: string) {
  const customer = await prisma.customer.findUnique({
    where: { externalId },
    include: {
      teuRecords: { orderBy: { month: 'asc' }, take: 12 },
      containerMixes: { orderBy: { month: 'asc' }, take: 12 },
      bookings: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!customer) throw AppError.notFound('Customer');

  const totalTeu = customer.teuRecords.reduce((s, r) => s + r.bookedTeu, 0);
  const shipmentsYtd = customer.bookings.length;
  const delivered = customer.bookings.filter((b) => b.status === 'DELIVERED');
  const onTimeRate = shipmentsYtd > 0 ? Math.round((delivered.length / shipmentsYtd) * 100) : 0;
  const avgOrderValue = shipmentsYtd > 0 ? Math.round((totalTeu * 580) / shipmentsYtd) : 0;

  return {
    customerId: customer.externalId,
    customerName: customer.name,
    tier: tierMap[customer.tier],
    region: customer.region,
    since: customer.since,
    lifetimeValue: Math.round(totalTeu * 580),
    lifetimeValueChange: 12.4,
    shipmentsYtd,
    shipmentsYtdChange: 8.2,
    onTimeRate,
    onTimeRateChange: 1.3,
    avgOrderValue,
    avgOrderValueChange: -2.1,
    monthlyTeu: customer.teuRecords.map((r) => ({
      month: r.month,
      bookedTeu: Math.round(r.bookedTeu),
      forecastTeu: r.forecastTeu ? Math.round(r.forecastTeu) : null,
    })),
    containerMix: customer.containerMixes.map((m) => ({
      month: m.month,
      teu20gp: Math.round(m.teu20gp),
      teu40hc: Math.round(m.teu40hc),
      teuOther: Math.round(m.teuOther),
    })),
    recentBookings: customer.bookings.map((b) => ({
      shipmentId: b.shipmentId,
      origin: b.origin,
      destination: b.destination,
      status: b.status,
      eta: b.eta.toISOString().split('T')[0],
      teu: b.teu,
    })),
  };
}
