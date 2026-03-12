import type {
  ContainerRecommendationResponse,
  ContainerRecommendationRequest,
  CommodityDashboard,
  CustomerSummary,
  ContainerMixFilters,
  ContainerMixData,
  CommodityDetail,
} from '../api/contract';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ── Container Recommendation ──
export const mockRecommendContainer = async (req: ContainerRecommendationRequest): Promise<ContainerRecommendationResponse> => {
  await delay(2500);
  const totalItems = req.skuList.reduce((acc, curr) => acc + curr.quantity, 0);
  if (totalItems > 1500) {
    return {
      recommendationId: 'REC-9942',
      recommendationType: 'SPLIT_LOAD',
      containerType: null,
      utilizationPercent: 92.5,
      reasonCodes: ['VOL_EXCEEDS_40HC', 'WEIGHT_OPTIMIZED'],
      confidenceLabel: 'HIGH',
      sparseDataMode: false,
    };
  }
  return {
    recommendationId: 'REC-9943',
    recommendationType: 'SINGLE_CONTAINER',
    containerType: '40HC',
    utilizationPercent: 88.2,
    reasonCodes: ['FITS_STANDARD_40HC'],
    confidenceLabel: 'HIGH',
    sparseDataMode: false,
  };
};

// ── Commodity Dashboard (Main page) ──
export const mockGetCommodityDashboard = async (): Promise<CommodityDashboard> => {
  await delay(800);
  return {
    kpi: {
      totalVolumeTeu: 18420,
      totalCommodities: 12,
      topCommodityName: 'Gạo',
      topCommodityVolume: 4250,
      nextMonthForecastTeu: 1680,
      nextMonthTopCommodity: 'Thủy sản',
      activeRegions: 3,
      coldStoragePercent: 28,
    },
    monthlyVolumes: [
      { month: 'T4/25', volumes: { GAO: 380, THUY_SAN: 290, CA_PHE: 210, GO: 180, DET_MAY: 150, KHAC: 120 }, totalVolume: 1330, forecastTotal: null },
      { month: 'T5/25', volumes: { GAO: 420, THUY_SAN: 310, CA_PHE: 230, GO: 190, DET_MAY: 160, KHAC: 130 }, totalVolume: 1440, forecastTotal: null },
      { month: 'T6/25', volumes: { GAO: 450, THUY_SAN: 350, CA_PHE: 200, GO: 200, DET_MAY: 170, KHAC: 140 }, totalVolume: 1510, forecastTotal: null },
      { month: 'T7/25', volumes: { GAO: 520, THUY_SAN: 400, CA_PHE: 180, GO: 210, DET_MAY: 180, KHAC: 150 }, totalVolume: 1640, forecastTotal: null },
      { month: 'T8/25', volumes: { GAO: 550, THUY_SAN: 380, CA_PHE: 170, GO: 220, DET_MAY: 190, KHAC: 140 }, totalVolume: 1650, forecastTotal: null },
      { month: 'T9/25', volumes: { GAO: 480, THUY_SAN: 340, CA_PHE: 190, GO: 200, DET_MAY: 175, KHAC: 135 }, totalVolume: 1520, forecastTotal: null },
      { month: 'T10/25', volumes: { GAO: 400, THUY_SAN: 310, CA_PHE: 250, GO: 180, DET_MAY: 160, KHAC: 120 }, totalVolume: 1420, forecastTotal: null },
      { month: 'T11/25', volumes: { GAO: 380, THUY_SAN: 280, CA_PHE: 280, GO: 170, DET_MAY: 150, KHAC: 110 }, totalVolume: 1370, forecastTotal: null },
      { month: 'T12/25', volumes: { GAO: 350, THUY_SAN: 260, CA_PHE: 300, GO: 160, DET_MAY: 140, KHAC: 100 }, totalVolume: 1310, forecastTotal: null },
      { month: 'T1/26', volumes: { GAO: 320, THUY_SAN: 240, CA_PHE: 320, GO: 150, DET_MAY: 130, KHAC: 90 }, totalVolume: 1250, forecastTotal: null },
      { month: 'T2/26', volumes: { GAO: 300, THUY_SAN: 250, CA_PHE: 280, GO: 140, DET_MAY: 120, KHAC: 100 }, totalVolume: 1190, forecastTotal: null },
      { month: 'T3/26', volumes: { GAO: 360, THUY_SAN: 290, CA_PHE: 240, GO: 170, DET_MAY: 145, KHAC: 115 }, totalVolume: 1320, forecastTotal: null },
      { month: 'T4/26', volumes: {}, totalVolume: 0, forecastTotal: 1450 },
      { month: 'T5/26', volumes: {}, totalVolume: 0, forecastTotal: 1550 },
      { month: 'T6/26', volumes: {}, totalVolume: 0, forecastTotal: 1620 },
      { month: 'T7/26', volumes: {}, totalVolume: 0, forecastTotal: 1750 },
    ],
    regionDemands: [
      {
        regionCode: 'MIEN_NAM',
        regionName: 'Miền Nam',
        totalTeu: 8640,
        topCommodity: 'Gạo',
        topCommodityTeu: 2350,
        growthPercent: 12.5,
        warehouseCount: 18,
        coldStorageCount: 7,
      },
      {
        regionCode: 'MIEN_BAC',
        regionName: 'Miền Bắc',
        totalTeu: 5980,
        topCommodity: 'Điện tử',
        topCommodityTeu: 1420,
        growthPercent: 8.3,
        warehouseCount: 14,
        coldStorageCount: 4,
      },
      {
        regionCode: 'MIEN_TRUNG',
        regionName: 'Miền Trung',
        totalTeu: 3800,
        topCommodity: 'Thủy sản',
        topCommodityTeu: 1180,
        growthPercent: 15.1,
        warehouseCount: 9,
        coldStorageCount: 5,
      },
    ],
    commodityRankings: [
      { commodityCode: 'GAO', commodityName: 'Gạo', category: 'NONG_SAN', totalTeu: 4250, growthPercent: 11.2, topRegion: 'Miền Nam', seasonalPeak: 'Tháng 7' },
      { commodityCode: 'THUY_SAN', commodityName: 'Thủy sản', category: 'THUY_SAN', totalTeu: 3520, growthPercent: 18.5, topRegion: 'Miền Trung', seasonalPeak: 'Tháng 7' },
      { commodityCode: 'CA_PHE', commodityName: 'Cà phê', category: 'NONG_SAN', totalTeu: 2870, growthPercent: 7.8, topRegion: 'Miền Trung', seasonalPeak: 'Tháng 12' },
      { commodityCode: 'GO', commodityName: 'Gỗ & SP gỗ', category: 'VAT_LIEU', totalTeu: 2100, growthPercent: 5.2, topRegion: 'Miền Nam', seasonalPeak: 'Tháng 8' },
      { commodityCode: 'DET_MAY', commodityName: 'Dệt may', category: 'CONG_NGHIEP', totalTeu: 1820, growthPercent: 9.1, topRegion: 'Miền Nam', seasonalPeak: 'Tháng 9' },
      { commodityCode: 'DIEN_TU', commodityName: 'Điện tử', category: 'CONG_NGHIEP', totalTeu: 1580, growthPercent: 22.3, topRegion: 'Miền Bắc', seasonalPeak: 'Tháng 11' },
      { commodityCode: 'CAO_SU', commodityName: 'Cao su', category: 'NONG_SAN', totalTeu: 1200, growthPercent: 3.4, topRegion: 'Miền Nam', seasonalPeak: 'Tháng 10' },
      { commodityCode: 'HAT_TIEU', commodityName: 'Hạt tiêu', category: 'NONG_SAN', totalTeu: 890, growthPercent: 6.7, topRegion: 'Miền Trung', seasonalPeak: 'Tháng 3' },
      { commodityCode: 'HAT_DIEU', commodityName: 'Hạt điều', category: 'NONG_SAN', totalTeu: 760, growthPercent: 14.1, topRegion: 'Miền Nam', seasonalPeak: 'Tháng 4' },
      { commodityCode: 'GIAY_DEP', commodityName: 'Giày dép', category: 'CONG_NGHIEP', totalTeu: 650, growthPercent: 8.9, topRegion: 'Miền Nam', seasonalPeak: 'Tháng 8' },
    ],
    seasonalForecasts: [
      { commodityCode: 'THUY_SAN', commodityName: 'Thủy sản', currentMonthTeu: 290, nextMonthTeu: 350, changePercent: 20.7, region: 'Miền Trung', trend: 'UP' },
      { commodityCode: 'GAO', commodityName: 'Gạo', currentMonthTeu: 360, nextMonthTeu: 420, changePercent: 16.7, region: 'Miền Nam', trend: 'UP' },
      { commodityCode: 'DET_MAY', commodityName: 'Dệt may', currentMonthTeu: 145, nextMonthTeu: 165, changePercent: 13.8, region: 'Miền Nam', trend: 'UP' },
      { commodityCode: 'DIEN_TU', commodityName: 'Điện tử', currentMonthTeu: 130, nextMonthTeu: 150, changePercent: 15.4, region: 'Miền Bắc', trend: 'UP' },
      { commodityCode: 'CA_PHE', commodityName: 'Cà phê', currentMonthTeu: 240, nextMonthTeu: 210, changePercent: -12.5, region: 'Tây Nguyên', trend: 'DOWN' },
      { commodityCode: 'CAO_SU', commodityName: 'Cao su', currentMonthTeu: 100, nextMonthTeu: 95, changePercent: -5.0, region: 'Miền Nam', trend: 'DOWN' },
      { commodityCode: 'GO', commodityName: 'Gỗ & SP gỗ', currentMonthTeu: 170, nextMonthTeu: 185, changePercent: 8.8, region: 'Miền Nam', trend: 'UP' },
      { commodityCode: 'HAT_TIEU', commodityName: 'Hạt tiêu', currentMonthTeu: 75, nextMonthTeu: 72, changePercent: -4.0, region: 'Miền Trung', trend: 'STABLE' },
    ],
    containerDemand: [
      { containerType: 'Dry 40HC', qualityGrade: 'Grade A', teu: 6840, percent: 37, topCommodity: 'Gạo' },
      { containerType: 'Dry 20GP', qualityGrade: 'Grade B', teu: 4920, percent: 27, topCommodity: 'Cà phê' },
      { containerType: 'Reefer 40', qualityGrade: 'Grade A', teu: 3280, percent: 18, topCommodity: 'Thủy sản' },
      { containerType: 'Reefer 20', qualityGrade: 'Grade A', teu: 1840, percent: 10, topCommodity: 'Thủy sản' },
      { containerType: 'Open Top', qualityGrade: 'Grade B', teu: 920, percent: 5, topCommodity: 'Gỗ' },
      { containerType: 'Flat Rack', qualityGrade: 'Grade C', teu: 620, percent: 3, topCommodity: 'Máy móc' },
    ],
  };
};

// ── Commodity Detail ──
export const mockGetCommodityDetail = async (commodityCode: string): Promise<CommodityDetail> => {
  await delay(600);

  const commodityMap: Record<string, CommodityDetail> = {
    GAO: {
      commodityCode: 'GAO',
      commodityName: 'Gạo',
      category: 'NONG_SAN',
      totalTeu12m: 4250,
      growthPercent: 11.2,
      seasonalPatterns: [
        { month: 1, label: 'Tháng 1', index: 45 },
        { month: 2, label: 'Tháng 2', index: 40 },
        { month: 3, label: 'Tháng 3', index: 55 },
        { month: 4, label: 'Tháng 4', index: 60 },
        { month: 5, label: 'Tháng 5', index: 70 },
        { month: 6, label: 'Tháng 6', index: 80 },
        { month: 7, label: 'Tháng 7', index: 95 },
        { month: 8, label: 'Tháng 8', index: 90 },
        { month: 9, label: 'Tháng 9', index: 75 },
        { month: 10, label: 'Tháng 10', index: 55 },
        { month: 11, label: 'Tháng 11', index: 50 },
        { month: 12, label: 'Tháng 12', index: 42 },
      ],
      regionBreakdown: [
        { regionCode: 'MIEN_NAM', regionName: 'Miền Nam', volumeTeu: 2350, percent: 55, warehouseType: 'KHO_THUONG' },
        { regionCode: 'MIEN_TRUNG', regionName: 'Miền Trung', volumeTeu: 1100, percent: 26, warehouseType: 'KHO_THUONG' },
        { regionCode: 'MIEN_BAC', regionName: 'Miền Bắc', volumeTeu: 800, percent: 19, warehouseType: 'KHO_THUONG' },
      ],
      monthlyTrend: [
        { month: 'T4/25', volumeTeu: 380, forecastTeu: null },
        { month: 'T5/25', volumeTeu: 420, forecastTeu: null },
        { month: 'T6/25', volumeTeu: 450, forecastTeu: null },
        { month: 'T7/25', volumeTeu: 520, forecastTeu: null },
        { month: 'T8/25', volumeTeu: 550, forecastTeu: null },
        { month: 'T9/25', volumeTeu: 480, forecastTeu: null },
        { month: 'T10/25', volumeTeu: 400, forecastTeu: null },
        { month: 'T11/25', volumeTeu: 380, forecastTeu: null },
        { month: 'T12/25', volumeTeu: 350, forecastTeu: null },
        { month: 'T1/26', volumeTeu: 320, forecastTeu: null },
        { month: 'T2/26', volumeTeu: 300, forecastTeu: null },
        { month: 'T3/26', volumeTeu: 360, forecastTeu: null },
        { month: 'T4/26', volumeTeu: 0, forecastTeu: 410 },
        { month: 'T5/26', volumeTeu: 0, forecastTeu: 450 },
      ],
      containerRequirements: [
        { containerType: 'DRY_40HC', qualityGrade: 'GRADE_A', temperatureRange: null },
        { containerType: 'DRY_20GP', qualityGrade: 'GRADE_B', temperatureRange: null },
      ],
      topCustomers: [
        { customerId: 'CUST-001', customerName: 'Vinafood II', volumeTeu: 680 },
        { customerId: 'CUST-002', customerName: 'Intimex Group', volumeTeu: 520 },
        { customerId: 'CUST-003', customerName: 'Trung An Hi-Tech', volumeTeu: 410 },
        { customerId: 'CUST-008', customerName: 'Loc Troi Group', volumeTeu: 350 },
        { customerId: 'CUST-009', customerName: 'AGPPS', volumeTeu: 280 },
      ],
    },
  };

  // Generate default detail for unknown commodity
  const detail = commodityMap[commodityCode];
  if (detail) return detail;

  return {
    commodityCode,
    commodityName: commodityCode,
    category: 'NONG_SAN',
    totalTeu12m: 1000,
    growthPercent: 5.0,
    seasonalPatterns: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: `Tháng ${i + 1}`,
      index: 40 + Math.random() * 40,
    })),
    regionBreakdown: [
      { regionCode: 'MIEN_NAM', regionName: 'Miền Nam', volumeTeu: 500, percent: 50, warehouseType: 'KHO_THUONG' },
      { regionCode: 'MIEN_BAC', regionName: 'Miền Bắc', volumeTeu: 300, percent: 30, warehouseType: 'KHO_THUONG' },
      { regionCode: 'MIEN_TRUNG', regionName: 'Miền Trung', volumeTeu: 200, percent: 20, warehouseType: 'KHO_THUONG' },
    ],
    monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
      month: `T${(i + 4 > 12 ? i - 8 : i + 4)}/${i + 4 > 12 ? '26' : '25'}`,
      volumeTeu: Math.round(80 + Math.random() * 40),
      forecastTeu: null,
    })),
    containerRequirements: [
      { containerType: 'DRY_40HC', qualityGrade: 'GRADE_B', temperatureRange: null },
    ],
    topCustomers: [
      { customerId: 'CUST-001', customerName: 'Khách hàng mẫu', volumeTeu: 200 },
    ],
  };
};

// ── Customers ──
const customers: CustomerSummary[] = [
  { customerId: 'CUST-001', customerName: 'Vinafood II', tier: 'Tier 1', region: 'Miền Nam', totalTeu: 4231, topCommodity: 'Gạo' },
  { customerId: 'CUST-002', customerName: 'Intimex Group', tier: 'Tier 1', region: 'Miền Nam', totalTeu: 3512, topCommodity: 'Cà phê' },
  { customerId: 'CUST-003', customerName: 'Trung An Hi-Tech Farming', tier: 'Tier 2', region: 'Miền Nam', totalTeu: 2890, topCommodity: 'Gạo' },
  { customerId: 'CUST-004', customerName: 'Minh Phú Seafood', tier: 'Tier 1', region: 'Miền Trung', totalTeu: 2150, topCommodity: 'Thủy sản' },
  { customerId: 'CUST-005', customerName: 'Phong Phú Corp', tier: 'Tier 2', region: 'Miền Nam', totalTeu: 1870, topCommodity: 'Dệt may' },
  { customerId: 'CUST-006', customerName: 'Samsung Electronics VN', tier: 'Tier 1', region: 'Miền Bắc', totalTeu: 3214, topCommodity: 'Điện tử' },
  { customerId: 'CUST-007', customerName: 'Trường Hải Auto (THACO)', tier: 'Tier 1', region: 'Miền Trung', totalTeu: 1980, topCommodity: 'Máy móc' },
  { customerId: 'CUST-008', customerName: 'Lộc Trời Group', tier: 'Tier 2', region: 'Miền Nam', totalTeu: 1680, topCommodity: 'Gạo' },
  { customerId: 'CUST-009', customerName: 'Vĩnh Hoàn Corp', tier: 'Tier 2', region: 'Miền Nam', totalTeu: 1420, topCommodity: 'Thủy sản' },
  { customerId: 'CUST-010', customerName: 'Đắk Lắk Coffee', tier: 'Tier 3', region: 'Miền Trung', totalTeu: 890, topCommodity: 'Cà phê' },
];

export const mockGetCustomers = async (): Promise<CustomerSummary[]> => {
  await delay(600);
  return customers;
};

// ── Container Mix ──
export const mockGetContainerMix = async (_filters: ContainerMixFilters): Promise<ContainerMixData> => {
  await delay(700);
  return {
    monthlyMix: [
      { month: 'T3', teu20gp: 420, teu40hc: 480, teuOther: 80 },
      { month: 'T4', teu20gp: 440, teu40hc: 520, teuOther: 90 },
      { month: 'T5', teu20gp: 480, teu40hc: 550, teuOther: 90 },
      { month: 'T6', teu20gp: 510, teu40hc: 590, teuOther: 100 },
      { month: 'T7', teu20gp: 560, teu40hc: 680, teuOther: 110 },
      { month: 'T8', teu20gp: 580, teu40hc: 720, teuOther: 120 },
      { month: 'T9', teu20gp: 550, teu40hc: 690, teuOther: 140 },
      { month: 'T10', teu20gp: 490, teu40hc: 560, teuOther: 100 },
      { month: 'T11', teu20gp: 440, teu40hc: 500, teuOther: 80 },
      { month: 'T12', teu20gp: 400, teu40hc: 450, teuOther: 40 },
      { month: 'T1', teu20gp: 370, teu40hc: 380, teuOther: 30 },
      { month: 'T2', teu20gp: 390, teu40hc: 420, teuOther: 40 },
    ],
    yearlyShare: [
      { type: 'Dry 40HC', teu: 6840, percent: 37 },
      { type: 'Dry 20GP', teu: 4920, percent: 27 },
      { type: 'Reefer 40', teu: 3280, percent: 18 },
      { type: 'Reefer 20', teu: 1840, percent: 10 },
      { type: 'Open Top / Flat Rack', teu: 1540, percent: 8 },
    ],
    mixByCustomerMonth: [
      { customerId: 'CUST-001', customerName: 'Vinafood II', month: 'T8', teu20gp: 190, teu40hc: 250, teuOther: 30 },
      { customerId: 'CUST-004', customerName: 'Minh Phú Seafood', month: 'T7', teu20gp: 80, teu40hc: 120, teuOther: 60 },
      { customerId: 'CUST-002', customerName: 'Intimex Group', month: 'T12', teu20gp: 150, teu40hc: 200, teuOther: 20 },
      { customerId: 'CUST-006', customerName: 'Samsung Electronics VN', month: 'T11', teu20gp: 120, teu40hc: 280, teuOther: 15 },
      { customerId: 'CUST-005', customerName: 'Phong Phú Corp', month: 'T9', teu20gp: 100, teu40hc: 140, teuOther: 10 },
    ],
    seasonalIndex: [
      { quarter: 'Q1', label: 'Tháng 1–3', index: 62 },
      { quarter: 'Q2', label: 'Tháng 4–6', index: 78 },
      { quarter: 'Q3', label: 'Tháng 7–9', index: 95 },
      { quarter: 'Q4', label: 'Tháng 10–12', index: 72 },
    ],
  };
};
