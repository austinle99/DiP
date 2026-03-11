import { prisma } from '../config/db.js';

export async function getPortfolioOverview() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const sixMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 6, 1);

  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  // Total booked TEU in last 12 months
  const bookedAgg = await prisma.teuRecord.aggregate({
    _sum: { bookedTeu: true },
    where: { month: { gte: fmt(twelveMonthsAgo) } },
  });
  const totalTeu12m = bookedAgg._sum.bookedTeu ?? 0;

  // Forecast TEU next 6 months
  const forecastAgg = await prisma.teuRecord.aggregate({
    _sum: { forecastTeu: true },
    where: {
      month: { gte: fmt(now), lte: fmt(sixMonthsAhead) },
      forecastTeu: { not: null },
    },
  });
  const forecastTeu6m = forecastAgg._sum.forecastTeu ?? 0;

  // High-potential customers (Tier 1 + Tier 2 with forecast growth)
  const highPotentialCustomers = await prisma.customer.count({
    where: { tier: { in: ['TIER_1', 'TIER_2'] } },
  });

  // 40HC share
  const mixAgg = await prisma.containerMix.aggregate({
    _sum: { teu20gp: true, teu40hc: true, teuOther: true },
    where: { month: { gte: fmt(twelveMonthsAgo) } },
  });
  const totalMix = (mixAgg._sum.teu20gp ?? 0) + (mixAgg._sum.teu40hc ?? 0) + (mixAgg._sum.teuOther ?? 0);
  const hcSharePercent = totalMix > 0 ? Math.round(((mixAgg._sum.teu40hc ?? 0) / totalMix) * 100) : 0;

  // Monthly TEU trend (last 18 months)
  const monthlyTeu = await prisma.teuRecord.groupBy({
    by: ['month'],
    _sum: { bookedTeu: true, forecastTeu: true },
    orderBy: { month: 'asc' },
    take: 18,
  });

  // Top 5 customers by forecast TEU
  const topCustomersRaw = await prisma.teuRecord.groupBy({
    by: ['customerId'],
    _sum: { forecastTeu: true, bookedTeu: true },
    where: { forecastTeu: { not: null } },
    orderBy: { _sum: { forecastTeu: 'desc' } },
    take: 5,
  });

  const customerIds = topCustomersRaw.map((c) => c.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, externalId: true, name: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const topCustomers = topCustomersRaw.map((c) => {
    const cust = customerMap.get(c.customerId);
    const forecast = c._sum.forecastTeu ?? 0;
    const booked = c._sum.bookedTeu ?? 1;
    return {
      customerId: cust?.externalId ?? c.customerId,
      customerName: cust?.name ?? 'Unknown',
      forecastTeu: Math.round(forecast),
      growthPercent: Math.round(((forecast - booked) / booked) * 100),
    };
  });

  // Upcoming peaks from seasonal index
  const upcomingPeaksRaw = await prisma.seasonalIndex.findMany({
    where: { index: { gte: 80 } },
    orderBy: { index: 'desc' },
    take: 5,
  });

  // Map peaks to customer data
  const allCustomers = await prisma.customer.findMany({
    select: { externalId: true, name: true, region: true },
    take: 5,
  });
  const upcomingPeaks = upcomingPeaksRaw.map((p, i) => {
    const cust = allCustomers[i % allCustomers.length];
    return {
      customerId: cust?.externalId ?? 'N/A',
      customerName: cust?.name ?? 'Unknown',
      peakMonth: p.label,
      expectedTeu: Math.round(p.index * 50),
      region: cust?.region ?? p.tradeLane,
    };
  });

  return {
    totalTeu12m: Math.round(totalTeu12m),
    forecastTeu6m: Math.round(forecastTeu6m),
    highPotentialCustomers,
    hcSharePercent,
    monthlyTeu: monthlyTeu.map((m) => ({
      month: m.month,
      bookedTeu: Math.round(m._sum.bookedTeu ?? 0),
      forecastTeu: m._sum.forecastTeu ? Math.round(m._sum.forecastTeu) : null,
    })),
    topCustomers,
    upcomingPeaks,
  };
}
