// Type definitions for Demand Intelligence Platform
// Commodity-Centric Analysis for Vietnam Logistics

// ── Enums ──
export type ForecastHorizon = '30_DAYS' | '60_DAYS' | '90_DAYS' | '12_MONTHS';
export type ContainerType = '20GP' | '40HC' | null;
export type RecommendationType = 'SINGLE_CONTAINER' | 'SPLIT_LOAD' | 'MANUAL_REVIEW';
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

export type CommodityCategory = 'NONG_SAN' | 'THUY_SAN' | 'CONG_NGHIEP' | 'TIEU_DUNG' | 'VAT_LIEU';
export type RegionCode = 'MIEN_BAC' | 'MIEN_TRUNG' | 'MIEN_NAM';
export type WarehouseType = 'KHO_LANH' | 'KHO_THUONG';
export type WarehouseQuality = 'CAO_CAP' | 'TIEU_CHUAN';
export type ContainerKind = 'DRY_20GP' | 'DRY_40HC' | 'REEFER_20' | 'REEFER_40' | 'OPEN_TOP' | 'FLAT_RACK';
export type ContainerQualityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

// ── Commodity Dashboard (Main page) ──

export interface CommodityKpi {
  totalVolumeTeu: number;
  totalCommodities: number;
  topCommodityName: string;
  topCommodityVolume: number;
  nextMonthForecastTeu: number;
  nextMonthTopCommodity: string;
  activeRegions: number;
  coldStoragePercent: number;
}

export interface MonthlyCommodityVolume {
  month: string;
  volumes: Record<string, number>; // commodityCode -> TEU
  totalVolume: number;
  forecastTotal: number | null;
}

export interface RegionDemand {
  regionCode: RegionCode;
  regionName: string;
  totalTeu: number;
  topCommodity: string;
  topCommodityTeu: number;
  growthPercent: number;
  warehouseCount: number;
  coldStorageCount: number;
}

export interface CommodityRanking {
  commodityCode: string;
  commodityName: string;
  category: CommodityCategory;
  totalTeu: number;
  growthPercent: number;
  topRegion: string;
  seasonalPeak: string; // "Tháng 7" etc.
}

export interface SeasonalForecast {
  commodityCode: string;
  commodityName: string;
  currentMonthTeu: number;
  nextMonthTeu: number;
  changePercent: number;
  region: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface ContainerDemandByType {
  containerType: string;
  qualityGrade: string;
  teu: number;
  percent: number;
  topCommodity: string;
}

export interface CommodityDashboard {
  kpi: CommodityKpi;
  monthlyVolumes: MonthlyCommodityVolume[];
  regionDemands: RegionDemand[];
  commodityRankings: CommodityRanking[];
  seasonalForecasts: SeasonalForecast[];
  containerDemand: ContainerDemandByType[];
}

// ── Commodity Detail ──

export interface CommoditySeasonalPattern {
  month: number;
  label: string;
  index: number; // 0-100
}

export interface CommodityRegionBreakdown {
  regionCode: RegionCode;
  regionName: string;
  volumeTeu: number;
  percent: number;
  warehouseType: WarehouseType;
}

export interface CommodityDetail {
  commodityCode: string;
  commodityName: string;
  category: CommodityCategory;
  totalTeu12m: number;
  growthPercent: number;
  seasonalPatterns: CommoditySeasonalPattern[];
  regionBreakdown: CommodityRegionBreakdown[];
  monthlyTrend: { month: string; volumeTeu: number; forecastTeu: number | null }[];
  containerRequirements: {
    containerType: ContainerKind;
    qualityGrade: ContainerQualityGrade;
    temperatureRange: string | null;
  }[];
  topCustomers: { customerId: string; customerName: string; volumeTeu: number }[];
}

// ── Customer Info (simplified, commodity-linked) ──

export type CustomerTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  tier: CustomerTier;
  region: string;
  totalTeu: number;
  topCommodity: string;
}

// ── Container Recommendation ──

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

// ── Region Warehouse Info ──

export interface WarehouseInfo {
  warehouseCode: string;
  warehouseName: string;
  regionName: string;
  type: WarehouseType;
  quality: WarehouseQuality;
  capacity: number;
}

// ── Vehicle Info ──

export interface VehicleInfo {
  vehicleCode: string;
  vehicleName: string;
  type: string;
  capacity: number;
  region: string;
  status: string;
}

// ── Legacy types kept for compatibility ──

export type ShipmentStatus = 'IN_TRANSIT' | 'PENDING' | 'DELIVERED' | 'DELAYED';

export interface MonthlyTeu {
  month: string;
  bookedTeu: number;
  forecastTeu: number | null;
}

export interface ContainerMixFilters {
  customerId?: string;
  tradeLane?: string;
  year?: number;
  commodityCode?: string;
  regionCode?: string;
}

export interface ContainerMixData {
  monthlyMix: { month: string; teu20gp: number; teu40hc: number; teuOther: number }[];
  yearlyShare: { type: string; teu: number; percent: number }[];
  mixByCustomerMonth: { customerId: string; customerName: string; month: string; teu20gp: number; teu40hc: number; teuOther: number }[];
  seasonalIndex: { quarter: string; label: string; index: number }[];
}
