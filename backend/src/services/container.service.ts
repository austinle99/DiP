import { prisma } from '../config/db.js';

interface ContainerMixFilters {
  customerId?: string;
  tradeLane?: string;
  year?: number;
}

export async function getContainerMix(filters: ContainerMixFilters) {
  const where: Record<string, unknown> = {};

  if (filters.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { externalId: filters.customerId },
      select: { id: true },
    });
    if (customer) where.customerId = customer.id;
  }
  if (filters.tradeLane) where.tradeLane = filters.tradeLane;
  if (filters.year) where.month = { startsWith: String(filters.year) };

  // Monthly mix
  const mixes = await prisma.containerMix.findMany({
    where,
    orderBy: { month: 'asc' },
    include: { customer: { select: { externalId: true, name: true } } },
  });

  const monthlyAgg = new Map<string, { teu20gp: number; teu40hc: number; teuOther: number }>();
  for (const m of mixes) {
    const existing = monthlyAgg.get(m.month) ?? { teu20gp: 0, teu40hc: 0, teuOther: 0 };
    existing.teu20gp += m.teu20gp;
    existing.teu40hc += m.teu40hc;
    existing.teuOther += m.teuOther;
    monthlyAgg.set(m.month, existing);
  }

  const monthlyMix = Array.from(monthlyAgg.entries()).map(([month, data]) => ({
    month,
    teu20gp: Math.round(data.teu20gp),
    teu40hc: Math.round(data.teu40hc),
    teuOther: Math.round(data.teuOther),
  }));

  // Yearly share totals
  const totals = mixes.reduce(
    (acc, m) => {
      acc.teu20gp += m.teu20gp;
      acc.teu40hc += m.teu40hc;
      acc.teuOther += m.teuOther;
      return acc;
    },
    { teu20gp: 0, teu40hc: 0, teuOther: 0 },
  );
  const grandTotal = totals.teu20gp + totals.teu40hc + totals.teuOther;

  const yearlyShare = [
    { type: "20' GP", teu: Math.round(totals.teu20gp), percent: grandTotal > 0 ? Math.round((totals.teu20gp / grandTotal) * 100) : 0 },
    { type: "40' HC", teu: Math.round(totals.teu40hc), percent: grandTotal > 0 ? Math.round((totals.teu40hc / grandTotal) * 100) : 0 },
    { type: 'Other', teu: Math.round(totals.teuOther), percent: grandTotal > 0 ? Math.round((totals.teuOther / grandTotal) * 100) : 0 },
  ];

  // Mix by customer/month (top entries)
  const mixByCustomerMonth = mixes.slice(0, 20).map((m) => ({
    customerId: m.customer.externalId,
    customerName: m.customer.name,
    month: m.month,
    teu20gp: Math.round(m.teu20gp),
    teu40hc: Math.round(m.teu40hc),
    teuOther: Math.round(m.teuOther),
  }));

  // Seasonal index
  const seasonalWhere: Record<string, unknown> = {};
  if (filters.tradeLane) seasonalWhere.tradeLane = filters.tradeLane;
  if (filters.year) seasonalWhere.year = filters.year;

  const seasonalIndex = await prisma.seasonalIndex.findMany({
    where: seasonalWhere,
    orderBy: [{ year: 'asc' }, { quarter: 'asc' }],
    take: 4,
  });

  return {
    monthlyMix,
    yearlyShare,
    mixByCustomerMonth,
    seasonalIndex: seasonalIndex.map((s) => ({
      quarter: s.quarter,
      label: s.label,
      index: s.index,
    })),
  };
}
