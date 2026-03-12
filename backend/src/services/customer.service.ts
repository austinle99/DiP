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

  // Resolve region names
  const regions = await prisma.region.findMany({ select: { id: true, name: true } });
  const regionNameMap = new Map(regions.map((r) => [r.id, r.name]));

  // Get top commodity per region from demand data
  const regionCommodities = await prisma.commodityDemand.groupBy({
    by: ['regionId', 'commodityId'],
    _sum: { volumeTeu: true },
    orderBy: { _sum: { volumeTeu: 'desc' } },
  });

  const commodities = await prisma.commodity.findMany({ select: { id: true, name: true } });
  const commodityNameMap = new Map(commodities.map((c) => [c.id, c.name]));

  // First occurrence per region = highest volume commodity
  const regionTopCommodity = new Map<string, string>();
  for (const rc of regionCommodities) {
    if (!regionTopCommodity.has(rc.regionId)) {
      regionTopCommodity.set(rc.regionId, commodityNameMap.get(rc.commodityId) ?? '—');
    }
  }

  return customers.map((c) => ({
    customerId: c.externalId,
    customerName: c.name,
    tier: tierMap[c.tier],
    region: c.regionId ? (regionNameMap.get(c.regionId) ?? '—') : '—',
    totalTeu: Math.round(c.teuRecords.reduce((sum, r) => sum + r.bookedTeu, 0)),
    topCommodity: c.regionId ? (regionTopCommodity.get(c.regionId) ?? '—') : '—',
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

  // Resolve region name
  let regionName = '—';
  if (customer.regionId) {
    const region = await prisma.region.findUnique({
      where: { id: customer.regionId },
      select: { name: true },
    });
    regionName = region?.name ?? '—';
  }

  const totalTeu = customer.teuRecords.reduce((s, r) => s + r.bookedTeu, 0);
  const shipmentsYtd = customer.bookings.length;
  const delivered = customer.bookings.filter((b) => b.status === 'DELIVERED');
  const onTimeRate = shipmentsYtd > 0 ? Math.round((delivered.length / shipmentsYtd) * 100) : 0;
  const avgOrderValue = shipmentsYtd > 0 ? Math.round((totalTeu * 580) / shipmentsYtd) : 0;

  return {
    customerId: customer.externalId,
    customerName: customer.name,
    tier: tierMap[customer.tier],
    region: regionName,
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
