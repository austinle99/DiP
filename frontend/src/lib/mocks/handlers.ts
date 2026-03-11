import type {
  ContainerRecommendationResponse,
  ContainerRecommendationRequest,
  PortfolioOverview,
  CustomerSummary,
  CustomerDetail,
  ContainerMixFilters,
  ContainerMixData,
} from '../api/contract';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ── Container Recommendation (existing) ──
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

// ── Portfolio Overview ──
export const mockGetPortfolioOverview = async (): Promise<PortfolioOverview> => {
  await delay(800);
  return {
    totalTeu12m: 12847,
    forecastTeu6m: 7420,
    highPotentialCustomers: 14,
    hcSharePercent: 62,
    monthlyTeu: [
      { month: 'Mar 25', bookedTeu: 980, forecastTeu: null },
      { month: 'Apr 25', bookedTeu: 1050, forecastTeu: null },
      { month: 'May 25', bookedTeu: 1120, forecastTeu: null },
      { month: 'Jun 25', bookedTeu: 1200, forecastTeu: null },
      { month: 'Jul 25', bookedTeu: 1350, forecastTeu: null },
      { month: 'Aug 25', bookedTeu: 1420, forecastTeu: null },
      { month: 'Sep 25', bookedTeu: 1380, forecastTeu: null },
      { month: 'Oct 25', bookedTeu: 1150, forecastTeu: null },
      { month: 'Nov 25', bookedTeu: 1020, forecastTeu: null },
      { month: 'Dec 25', bookedTeu: 890, forecastTeu: null },
      { month: 'Jan 26', bookedTeu: 780, forecastTeu: null },
      { month: 'Feb 26', bookedTeu: 850, forecastTeu: null },
      { month: 'Mar 26', bookedTeu: null as unknown as number, forecastTeu: 1100 },
      { month: 'Apr 26', bookedTeu: null as unknown as number, forecastTeu: 1200 },
      { month: 'May 26', bookedTeu: null as unknown as number, forecastTeu: 1280 },
      { month: 'Jun 26', bookedTeu: null as unknown as number, forecastTeu: 1350 },
      { month: 'Jul 26', bookedTeu: null as unknown as number, forecastTeu: 1450 },
      { month: 'Aug 26', bookedTeu: null as unknown as number, forecastTeu: 1540 },
    ],
    topCustomers: [
      { customerId: 'CUST-001', customerName: 'Maersk Logistics', forecastTeu: 1820, growthPercent: 18.2 },
      { customerId: 'CUST-002', customerName: 'CMA CGM SA', forecastTeu: 1540, growthPercent: 12.5 },
      { customerId: 'CUST-003', customerName: 'Evergreen Marine', forecastTeu: 1280, growthPercent: 9.1 },
      { customerId: 'CUST-004', customerName: 'Hapag-Lloyd AG', forecastTeu: 980, growthPercent: 7.8 },
      { customerId: 'CUST-005', customerName: 'Yang Ming Transport', forecastTeu: 870, growthPercent: 5.3 },
    ],
    upcomingPeaks: [
      { customerId: 'CUST-001', customerName: 'Maersk Logistics', peakMonth: 'Jul 26', expectedTeu: 420, region: 'Asia Pacific' },
      { customerId: 'CUST-002', customerName: 'CMA CGM SA', peakMonth: 'Aug 26', expectedTeu: 380, region: 'Europe' },
      { customerId: 'CUST-003', customerName: 'Evergreen Marine', peakMonth: 'Jul 26', expectedTeu: 310, region: 'Asia Pacific' },
      { customerId: 'CUST-006', customerName: 'ZIM Integrated', peakMonth: 'Sep 26', expectedTeu: 250, region: 'Latin America' },
      { customerId: 'CUST-004', customerName: 'Hapag-Lloyd AG', peakMonth: 'Aug 26', expectedTeu: 220, region: 'Europe' },
    ],
  };
};

// ── Customers ──
const customers: CustomerSummary[] = [
  { customerId: 'CUST-001', customerName: 'Maersk Logistics Ltd.', tier: 'Tier 1', region: 'Asia Pacific', totalTeu: 4231 },
  { customerId: 'CUST-002', customerName: 'CMA CGM SA', tier: 'Tier 1', region: 'Europe', totalTeu: 3512 },
  { customerId: 'CUST-003', customerName: 'Evergreen Marine', tier: 'Tier 2', region: 'Asia Pacific', totalTeu: 2890 },
  { customerId: 'CUST-004', customerName: 'Hapag-Lloyd AG', tier: 'Tier 1', region: 'Europe', totalTeu: 2150 },
  { customerId: 'CUST-005', customerName: 'Yang Ming Transport', tier: 'Tier 2', region: 'Asia Pacific', totalTeu: 1870 },
  { customerId: 'CUST-006', customerName: 'ZIM Integrated Shipping', tier: 'Tier 2', region: 'Latin America', totalTeu: 1214 },
  { customerId: 'CUST-007', customerName: 'ONE Network Express', tier: 'Tier 1', region: 'Asia Pacific', totalTeu: 1980 },
  { customerId: 'CUST-008', customerName: 'PIL Pacific Intl', tier: 'Tier 3', region: 'Middle East', totalTeu: 680 },
];

export const mockGetCustomers = async (): Promise<CustomerSummary[]> => {
  await delay(600);
  return customers;
};

const customerDetails: Record<string, CustomerDetail> = {
  'CUST-001': {
    customerId: 'CUST-001',
    customerName: 'Maersk Logistics Ltd.',
    tier: 'Tier 1',
    region: 'Asia Pacific',
    since: 2019,
    lifetimeValue: 2400000,
    lifetimeValueChange: 18,
    shipmentsYtd: 1247,
    shipmentsYtdChange: 5.3,
    onTimeRate: 94.2,
    onTimeRateChange: 1.8,
    avgOrderValue: 18500,
    avgOrderValueChange: -2.1,
    monthlyTeu: [
      { month: 'Mar 25', bookedTeu: 320, forecastTeu: null },
      { month: 'Apr 25', bookedTeu: 340, forecastTeu: null },
      { month: 'May 25', bookedTeu: 380, forecastTeu: null },
      { month: 'Jun 25', bookedTeu: 410, forecastTeu: null },
      { month: 'Jul 25', bookedTeu: 450, forecastTeu: null },
      { month: 'Aug 25', bookedTeu: 470, forecastTeu: null },
      { month: 'Sep 25', bookedTeu: 440, forecastTeu: null },
      { month: 'Oct 25', bookedTeu: 380, forecastTeu: null },
      { month: 'Nov 25', bookedTeu: 340, forecastTeu: null },
      { month: 'Dec 25', bookedTeu: 300, forecastTeu: null },
      { month: 'Jan 26', bookedTeu: 280, forecastTeu: null },
      { month: 'Feb 26', bookedTeu: 310, forecastTeu: null },
      { month: 'Mar 26', bookedTeu: null as unknown as number, forecastTeu: 360 },
      { month: 'Apr 26', bookedTeu: null as unknown as number, forecastTeu: 400 },
      { month: 'May 26', bookedTeu: null as unknown as number, forecastTeu: 420 },
      { month: 'Jun 26', bookedTeu: null as unknown as number, forecastTeu: 460 },
    ],
    containerMix: [
      { month: 'Mar 25', teu20gp: 140, teu40hc: 160, teuOther: 20 },
      { month: 'Apr 25', teu20gp: 150, teu40hc: 170, teuOther: 20 },
      { month: 'May 25', teu20gp: 160, teu40hc: 195, teuOther: 25 },
      { month: 'Jun 25', teu20gp: 170, teu40hc: 210, teuOther: 30 },
      { month: 'Jul 25', teu20gp: 185, teu40hc: 235, teuOther: 30 },
      { month: 'Aug 25', teu20gp: 190, teu40hc: 250, teuOther: 30 },
      { month: 'Sep 25', teu20gp: 180, teu40hc: 230, teuOther: 30 },
      { month: 'Oct 25', teu20gp: 160, teu40hc: 195, teuOther: 25 },
      { month: 'Nov 25', teu20gp: 140, teu40hc: 175, teuOther: 25 },
      { month: 'Dec 25', teu20gp: 120, teu40hc: 160, teuOther: 20 },
    ],
    recentBookings: [
      { shipmentId: 'SHP-2024-4821', origin: 'Shanghai, CN', destination: 'Rotterdam, NL', status: 'IN_TRANSIT', eta: 'Mar 15', teu: 24 },
      { shipmentId: 'SHP-2024-4819', origin: 'Busan, KR', destination: 'Hamburg, DE', status: 'PENDING', eta: 'Mar 22', teu: 18 },
      { shipmentId: 'SHP-2024-4815', origin: 'Ho Chi Minh, VN', destination: 'Los Angeles, US', status: 'DELIVERED', eta: 'Mar 8', teu: 32 },
      { shipmentId: 'SHP-2024-4810', origin: 'Ningbo, CN', destination: 'Felixstowe, UK', status: 'DELAYED', eta: 'Mar 18', teu: 20 },
    ],
  },
};

// Generate simple details for other customers
for (const c of customers) {
  if (!customerDetails[c.customerId]) {
    customerDetails[c.customerId] = {
      ...c,
      since: 2018 + Math.floor(Math.random() * 5),
      lifetimeValue: c.totalTeu * 580,
      lifetimeValueChange: Math.round((Math.random() * 20 - 5) * 10) / 10,
      shipmentsYtd: Math.round(c.totalTeu * 0.3),
      shipmentsYtdChange: Math.round((Math.random() * 10 - 2) * 10) / 10,
      onTimeRate: Math.round((88 + Math.random() * 8) * 10) / 10,
      onTimeRateChange: Math.round((Math.random() * 4 - 1) * 10) / 10,
      avgOrderValue: Math.round(14000 + Math.random() * 8000),
      avgOrderValueChange: Math.round((Math.random() * 6 - 3) * 10) / 10,
      monthlyTeu: Array.from({ length: 12 }, (_, i) => ({
        month: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'][i] + (i < 10 ? ' 25' : ' 26'),
        bookedTeu: Math.round(c.totalTeu / 12 * (0.8 + Math.random() * 0.4)),
        forecastTeu: null,
      })),
      containerMix: Array.from({ length: 10 }, (_, i) => ({
        month: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i] + ' 25',
        teu20gp: Math.round(c.totalTeu / 12 * 0.4 * (0.8 + Math.random() * 0.4)),
        teu40hc: Math.round(c.totalTeu / 12 * 0.5 * (0.8 + Math.random() * 0.4)),
        teuOther: Math.round(c.totalTeu / 12 * 0.1 * (0.8 + Math.random() * 0.4)),
      })),
      recentBookings: [
        { shipmentId: `SHP-${c.customerId}-001`, origin: 'Shanghai, CN', destination: 'Rotterdam, NL', status: 'IN_TRANSIT', eta: 'Mar 12', teu: 20 },
        { shipmentId: `SHP-${c.customerId}-002`, origin: 'Busan, KR', destination: 'Hamburg, DE', status: 'DELIVERED', eta: 'Mar 5', teu: 16 },
      ],
    };
  }
}

export const mockGetCustomerDetail = async (customerId: string): Promise<CustomerDetail> => {
  await delay(500);
  const detail = customerDetails[customerId];
  if (!detail) throw new Error(`Customer ${customerId} not found`);
  return detail;
};

// ── Container Mix ──
export const mockGetContainerMix = async (_filters: ContainerMixFilters): Promise<ContainerMixData> => {
  await delay(700);
  return {
    monthlyMix: [
      { month: 'Mar', teu20gp: 420, teu40hc: 480, teuOther: 80 },
      { month: 'Apr', teu20gp: 440, teu40hc: 520, teuOther: 90 },
      { month: 'May', teu20gp: 480, teu40hc: 550, teuOther: 90 },
      { month: 'Jun', teu20gp: 510, teu40hc: 590, teuOther: 100 },
      { month: 'Jul', teu20gp: 560, teu40hc: 680, teuOther: 110 },
      { month: 'Aug', teu20gp: 580, teu40hc: 720, teuOther: 120 },
      { month: 'Sep', teu20gp: 550, teu40hc: 690, teuOther: 140 },
      { month: 'Oct', teu20gp: 490, teu40hc: 560, teuOther: 100 },
      { month: 'Nov', teu20gp: 440, teu40hc: 500, teuOther: 80 },
      { month: 'Dec', teu20gp: 400, teu40hc: 450, teuOther: 40 },
      { month: 'Jan', teu20gp: 370, teu40hc: 380, teuOther: 30 },
      { month: 'Feb', teu20gp: 390, teu40hc: 420, teuOther: 40 },
    ],
    yearlyShare: [
      { type: '20ft Standard', teu: 5630, percent: 42 },
      { type: '40ft Standard', teu: 3740, percent: 28 },
      { type: '40ft High Cube', teu: 2410, percent: 18 },
      { type: 'Reefer', teu: 1070, percent: 8 },
      { type: 'Open Top / Flat Rack', teu: 540, percent: 4 },
    ],
    mixByCustomerMonth: [
      { customerId: 'CUST-001', customerName: 'Maersk Logistics', month: 'Aug', teu20gp: 190, teu40hc: 250, teuOther: 30 },
      { customerId: 'CUST-002', customerName: 'CMA CGM SA', month: 'Aug', teu20gp: 150, teu40hc: 200, teuOther: 40 },
      { customerId: 'CUST-003', customerName: 'Evergreen Marine', month: 'Jul', teu20gp: 120, teu40hc: 140, teuOther: 20 },
      { customerId: 'CUST-004', customerName: 'Hapag-Lloyd AG', month: 'Aug', teu20gp: 80, teu40hc: 110, teuOther: 15 },
      { customerId: 'CUST-005', customerName: 'Yang Ming Transport', month: 'Jul', teu20gp: 70, teu40hc: 80, teuOther: 10 },
    ],
    seasonalIndex: [
      { quarter: 'Q1', label: 'Jan–Mar', index: 65 },
      { quarter: 'Q2', label: 'Apr–Jun', index: 82 },
      { quarter: 'Q3', label: 'Jul–Sep', index: 95 },
      { quarter: 'Q4', label: 'Oct–Dec', index: 78 },
    ],
  };
};
