import { prisma } from '../config/db.js';
import { AppError } from '../utils/errors.js';

const categoryLabels: Record<string, string> = {
  NONG_SAN: 'Nông sản',
  THUY_SAN: 'Thủy sản',
  CONG_NGHIEP: 'Công nghiệp',
  TIEU_DUNG: 'Tiêu dùng',
  VAT_LIEU: 'Vật liệu',
};

const containerKindLabels: Record<string, string> = {
  DRY_20GP: 'Dry 20GP',
  DRY_40HC: 'Dry 40HC',
  REEFER_20: 'Reefer 20',
  REEFER_40: 'Reefer 40',
  OPEN_TOP: 'Open Top',
  FLAT_RACK: 'Flat Rack',
};

const qualityGradeLabels: Record<string, string> = {
  GRADE_A: 'Grade A',
  GRADE_B: 'Grade B',
  GRADE_C: 'Grade C',
};

export async function getCommodityDashboard() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  // ── KPI: total volume, top commodity, regions, cold storage ──

  const commodities = await prisma.commodity.findMany({
    include: {
      demands: {
        where: { month: { gte: fmt(twelveMonthsAgo) } },
      },
      seasonalPatterns: { orderBy: { index: 'desc' }, take: 1 },
      containerRequirements: true,
    },
  });

  const regions = await prisma.region.findMany({
    include: {
      demands: {
        where: { month: { gte: fmt(twelveMonthsAgo) } },
      },
      warehouses: true,
    },
  });

  // Aggregate volumes per commodity
  const commodityVolumes = commodities.map((c) => {
    const totalTeu = c.demands.reduce((s, d) => s + d.volumeTeu, 0);
    const forecastTeu = c.demands.reduce(
      (s, d) => s + (d.forecastTeu ?? 0),
      0,
    );
    return { ...c, totalTeu, forecastTeu };
  });

  commodityVolumes.sort((a, b) => b.totalTeu - a.totalTeu);

  const totalVolumeTeu = commodityVolumes.reduce((s, c) => s + c.totalTeu, 0);
  const topCommodity = commodityVolumes[0];

  // Cold storage: percentage of commodities needing reefer containers
  const reeferCommodityCount = commodities.filter((c) =>
    c.containerRequirements.some(
      (r) => r.containerType === 'REEFER_20' || r.containerType === 'REEFER_40',
    ),
  ).length;
  const coldStoragePercent =
    commodities.length > 0
      ? Math.round((reeferCommodityCount / commodities.length) * 100)
      : 0;

  // Next month forecast
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStr = fmt(nextMonth);
  const nextMonthDemands = await prisma.commodityDemand.findMany({
    where: { month: nextMonthStr, forecastTeu: { not: null } },
    include: { commodity: true },
  });
  const nextMonthForecastTeu = nextMonthDemands.reduce(
    (s, d) => s + (d.forecastTeu ?? 0),
    0,
  );
  const nextMonthTopDemand = nextMonthDemands.sort(
    (a, b) => (b.forecastTeu ?? 0) - (a.forecastTeu ?? 0),
  )[0];

  const kpi = {
    totalVolumeTeu: Math.round(totalVolumeTeu),
    totalCommodities: commodities.length,
    topCommodityName: topCommodity?.name ?? '—',
    topCommodityVolume: Math.round(topCommodity?.totalTeu ?? 0),
    nextMonthForecastTeu: Math.round(nextMonthForecastTeu),
    nextMonthTopCommodity: nextMonthTopDemand?.commodity.name ?? '—',
    activeRegions: regions.length,
    coldStoragePercent,
  };

  // ── Monthly volumes (last 12 months + forecast) ──

  const allDemands = await prisma.commodityDemand.findMany({
    where: { month: { gte: fmt(twelveMonthsAgo) } },
    include: { commodity: true },
    orderBy: { month: 'asc' },
  });

  const monthMap = new Map<
    string,
    { volumes: Record<string, number>; totalVolume: number; forecastTotal: number }
  >();

  for (const d of allDemands) {
    if (!monthMap.has(d.month)) {
      monthMap.set(d.month, { volumes: {}, totalVolume: 0, forecastTotal: 0 });
    }
    const entry = monthMap.get(d.month)!;
    entry.volumes[d.commodity.code] =
      (entry.volumes[d.commodity.code] ?? 0) + d.volumeTeu;
    entry.totalVolume += d.volumeTeu;
    entry.forecastTotal += d.forecastTeu ?? 0;
  }

  const monthlyVolumes = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      volumes: data.volumes,
      totalVolume: Math.round(data.totalVolume),
      forecastTotal: data.forecastTotal > 0 ? Math.round(data.forecastTotal) : null,
    }));

  // ── Region demands ──

  const regionDemands = regions.map((r) => {
    const totalTeu = r.demands.reduce((s, d) => s + d.volumeTeu, 0);
    // Top commodity per region
    const commodityTeuMap = new Map<string, { name: string; teu: number }>();
    for (const d of r.demands) {
      const commodity = commodities.find((c) => c.id === d.commodityId);
      if (!commodity) continue;
      const existing = commodityTeuMap.get(commodity.code) ?? {
        name: commodity.name,
        teu: 0,
      };
      existing.teu += d.volumeTeu;
      commodityTeuMap.set(commodity.code, existing);
    }
    const topRegionCommodity = Array.from(commodityTeuMap.values()).sort(
      (a, b) => b.teu - a.teu,
    )[0];

    return {
      regionCode: r.code,
      regionName: r.name,
      totalTeu: Math.round(totalTeu),
      topCommodity: topRegionCommodity?.name ?? '—',
      topCommodityTeu: Math.round(topRegionCommodity?.teu ?? 0),
      growthPercent: 0, // computed below if historical data available
      warehouseCount: r.warehouses.length,
      coldStorageCount: r.warehouses.filter((w) => w.type === 'KHO_LANH').length,
    };
  });

  // ── Commodity rankings ──

  const commodityRankings = commodityVolumes.map((c) => {
    // Find top region for this commodity
    const regionTeus = new Map<string, number>();
    for (const d of c.demands) {
      const region = regions.find((r) => r.id === d.regionId);
      if (!region) continue;
      regionTeus.set(region.name, (regionTeus.get(region.name) ?? 0) + d.volumeTeu);
    }
    const topRegion =
      Array.from(regionTeus.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    // Peak season from seasonal patterns
    const peakPattern = c.seasonalPatterns[0];

    return {
      commodityCode: c.code,
      commodityName: c.name,
      category: c.category as string,
      totalTeu: Math.round(c.totalTeu),
      growthPercent: 0, // placeholder — need historical comparison
      topRegion,
      seasonalPeak: peakPattern?.label ?? '—',
    };
  });

  // ── Seasonal forecasts (next month per commodity) ──

  const currentMonthStr = fmt(now);
  const currentDemands = await prisma.commodityDemand.findMany({
    where: { month: currentMonthStr },
    include: { commodity: true, region: true },
  });

  const forecastDemands = await prisma.commodityDemand.findMany({
    where: { month: nextMonthStr },
    include: { commodity: true, region: true },
  });

  const seasonalForecasts: Array<{
    commodityCode: string;
    commodityName: string;
    currentMonthTeu: number;
    nextMonthTeu: number;
    changePercent: number;
    region: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
  }> = [];

  for (const commodity of commodities) {
    const currentTeu = currentDemands
      .filter((d) => d.commodityId === commodity.id)
      .reduce((s, d) => s + d.volumeTeu, 0);
    const nextTeu = forecastDemands
      .filter((d) => d.commodityId === commodity.id)
      .reduce((s, d) => s + (d.forecastTeu ?? d.volumeTeu), 0);

    if (currentTeu === 0 && nextTeu === 0) continue;

    const changePercent =
      currentTeu > 0 ? Math.round(((nextTeu - currentTeu) / currentTeu) * 1000) / 10 : 0;

    // Top region for this commodity's forecast
    const topForecastRegion = forecastDemands
      .filter((d) => d.commodityId === commodity.id)
      .sort((a, b) => (b.forecastTeu ?? b.volumeTeu) - (a.forecastTeu ?? a.volumeTeu))[0];

    seasonalForecasts.push({
      commodityCode: commodity.code,
      commodityName: commodity.name,
      currentMonthTeu: Math.round(currentTeu),
      nextMonthTeu: Math.round(nextTeu),
      changePercent,
      region: topForecastRegion?.region.name ?? '—',
      trend: changePercent > 5 ? 'UP' : changePercent < -5 ? 'DOWN' : 'STABLE',
    });
  }

  // ── Container demand by type ──

  const containerReqs = await prisma.containerRequirement.findMany({
    include: { commodity: { include: { demands: true } } },
  });

  const containerMap = new Map<
    string,
    { qualityGrade: string; teu: number; topCommodity: string; topCommodityTeu: number }
  >();

  for (const req of containerReqs) {
    const key = containerKindLabels[req.containerType] ?? req.containerType;
    const commodityTeu = req.commodity.demands.reduce(
      (s, d) => s + d.volumeTeu,
      0,
    );
    const existing = containerMap.get(key);
    if (!existing || commodityTeu > existing.topCommodityTeu) {
      containerMap.set(key, {
        qualityGrade: qualityGradeLabels[req.qualityGrade] ?? req.qualityGrade,
        teu: (existing?.teu ?? 0) + commodityTeu,
        topCommodity: req.commodity.name,
        topCommodityTeu: commodityTeu,
      });
    } else {
      existing.teu += commodityTeu;
    }
  }

  const totalContainerTeu = Array.from(containerMap.values()).reduce(
    (s, c) => s + c.teu,
    0,
  );

  const containerDemand = Array.from(containerMap.entries())
    .sort((a, b) => b[1].teu - a[1].teu)
    .map(([containerType, data]) => ({
      containerType,
      qualityGrade: data.qualityGrade,
      teu: Math.round(data.teu),
      percent:
        totalContainerTeu > 0
          ? Math.round((data.teu / totalContainerTeu) * 100)
          : 0,
      topCommodity: data.topCommodity,
    }));

  return {
    kpi,
    monthlyVolumes,
    regionDemands,
    commodityRankings,
    seasonalForecasts,
    containerDemand,
  };
}

export async function getCommodityDetail(commodityCode: string) {
  const commodity = await prisma.commodity.findUnique({
    where: { code: commodityCode },
    include: {
      demands: {
        include: { region: true },
        orderBy: { month: 'asc' },
      },
      seasonalPatterns: { orderBy: { month: 'asc' } },
      containerRequirements: true,
    },
  });

  if (!commodity) throw AppError.notFound('Commodity');

  const totalTeu12m = commodity.demands.reduce((s, d) => s + d.volumeTeu, 0);

  // Region breakdown
  const regionTeuMap = new Map<
    string,
    { regionCode: string; regionName: string; teu: number; warehouseType: string }
  >();

  for (const d of commodity.demands) {
    const key = d.region.code;
    const existing = regionTeuMap.get(key) ?? {
      regionCode: d.region.code,
      regionName: d.region.name,
      teu: 0,
      warehouseType: 'KHO_THUONG',
    };
    existing.teu += d.volumeTeu;
    regionTeuMap.set(key, existing);
  }

  // Check if commodity requires cold storage
  const needsCold = commodity.containerRequirements.some(
    (r) => r.containerType === 'REEFER_20' || r.containerType === 'REEFER_40',
  );

  const regionBreakdown = Array.from(regionTeuMap.values())
    .sort((a, b) => b.teu - a.teu)
    .map((r) => ({
      regionCode: r.regionCode,
      regionName: r.regionName,
      volumeTeu: Math.round(r.teu),
      percent: totalTeu12m > 0 ? Math.round((r.teu / totalTeu12m) * 100) : 0,
      warehouseType: needsCold ? 'KHO_LANH' : 'KHO_THUONG',
    }));

  // Monthly trend
  const monthlyMap = new Map<string, { volumeTeu: number; forecastTeu: number | null }>();
  for (const d of commodity.demands) {
    const existing = monthlyMap.get(d.month) ?? { volumeTeu: 0, forecastTeu: null };
    existing.volumeTeu += d.volumeTeu;
    if (d.forecastTeu !== null) {
      existing.forecastTeu = (existing.forecastTeu ?? 0) + d.forecastTeu;
    }
    monthlyMap.set(d.month, existing);
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      volumeTeu: Math.round(data.volumeTeu),
      forecastTeu: data.forecastTeu !== null ? Math.round(data.forecastTeu) : null,
    }));

  // Seasonal patterns
  const seasonalPatterns = commodity.seasonalPatterns.map((p) => ({
    month: p.month,
    label: p.label,
    index: p.index,
  }));

  // Container requirements
  const containerRequirements = commodity.containerRequirements.map((r) => ({
    containerType: r.containerType as string,
    qualityGrade: r.qualityGrade as string,
    temperatureRange:
      r.temperatureMin !== null && r.temperatureMax !== null
        ? `${r.temperatureMin}°C ~ ${r.temperatureMax}°C`
        : null,
  }));

  // Top customers — derive from customer bookings if available, or return empty
  // Since there's no direct customer-commodity link, we return an empty array
  // In production, this would join through booking line items
  const topCustomers: Array<{
    customerId: string;
    customerName: string;
    volumeTeu: number;
  }> = [];

  // Calculate growth (simple: compare first half vs second half)
  const demands = commodity.demands;
  const midpoint = Math.floor(demands.length / 2);
  const firstHalf = demands.slice(0, midpoint).reduce((s, d) => s + d.volumeTeu, 0);
  const secondHalf = demands.slice(midpoint).reduce((s, d) => s + d.volumeTeu, 0);
  const growthPercent =
    firstHalf > 0
      ? Math.round(((secondHalf - firstHalf) / firstHalf) * 1000) / 10
      : 0;

  return {
    commodityCode: commodity.code,
    commodityName: commodity.name,
    category: commodity.category as string,
    totalTeu12m: Math.round(totalTeu12m),
    growthPercent,
    seasonalPatterns,
    regionBreakdown,
    monthlyTrend,
    containerRequirements,
    topCustomers,
  };
}
