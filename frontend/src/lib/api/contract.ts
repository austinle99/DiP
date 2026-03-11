// Type definitions for Demand Intelligence Platform

// ── Existing types ──
export type ForecastHorizon = '30_DAYS' | '60_DAYS' | '90_DAYS' | '12_MONTHS';
export type ContainerType = '20GP' | '40HC' | null;
export type RecommendationType = 'SINGLE_CONTAINER' | 'SPLIT_LOAD' | 'MANUAL_REVIEW';
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContainerRecommendationRequest {
  customerId: string;
  skuList: Array<{ skuId: string; quantity: number }>;
}

export interface ContainerRecommendationResponse {
  recommendationId: string;
  recommendationType: RecommendationType;
  containerType: ContainerType;
  utilizationPercent: number;
  reasonCodes: string[];
  confidenceLabel: ConfidenceLabel;
  sparseDataMode: boolean;
}

export interface LeadScoreResponse {
  score: number;
  nextBestAction: string;
  topDrivers: string[];
  reasonCodes: string[];
}

// ── Portfolio Overview ──
export interface MonthlyTeu {
  month: string;
  bookedTeu: number;
  forecastTeu: number | null;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  forecastTeu: number;
  growthPercent: number;
}

export interface SeasonalPeak {
  customerId: string;
  customerName: string;
  peakMonth: string;
  expectedTeu: number;
  region: string;
}

export interface PortfolioOverview {
  totalTeu12m: number;
  forecastTeu6m: number;
  highPotentialCustomers: number;
  hcSharePercent: number;
  monthlyTeu: MonthlyTeu[];
  topCustomers: TopCustomer[];
  upcomingPeaks: SeasonalPeak[];
}

// ── Customer 360 ──
export type CustomerTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  tier: CustomerTier;
  region: string;
  totalTeu: number;
}

export interface MonthlyContainerMix {
  month: string;
  teu20gp: number;
  teu40hc: number;
  teuOther: number;
}

export type ShipmentStatus = 'IN_TRANSIT' | 'PENDING' | 'DELIVERED' | 'DELAYED';

export interface RecentBooking {
  shipmentId: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  eta: string;
  teu: number;
}

export interface CustomerDetail {
  customerId: string;
  customerName: string;
  tier: CustomerTier;
  region: string;
  since: number;
  lifetimeValue: number;
  lifetimeValueChange: number;
  shipmentsYtd: number;
  shipmentsYtdChange: number;
  onTimeRate: number;
  onTimeRateChange: number;
  avgOrderValue: number;
  avgOrderValueChange: number;
  monthlyTeu: MonthlyTeu[];
  containerMix: MonthlyContainerMix[];
  recentBookings: RecentBooking[];
}

// ── Container Mix & Seasonality ──
export interface ContainerMixFilters {
  customerId?: string;
  tradeLane?: string;
  year?: number;
}

export interface ContainerTypeShare {
  type: string;
  teu: number;
  percent: number;
}

export interface MixByCustomerMonth {
  customerId: string;
  customerName: string;
  month: string;
  teu20gp: number;
  teu40hc: number;
  teuOther: number;
}

export interface SeasonalIndex {
  quarter: string;
  label: string;
  index: number;
}

export interface ContainerMixData {
  monthlyMix: MonthlyContainerMix[];
  yearlyShare: ContainerTypeShare[];
  mixByCustomerMonth: MixByCustomerMonth[];
  seasonalIndex: SeasonalIndex[];
}
