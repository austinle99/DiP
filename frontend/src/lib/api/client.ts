import type {
  CommodityDashboard,
  CommodityDetail,
  CustomerSummary,
  ContainerMixFilters,
  ContainerMixData,
  ContainerRecommendationRequest,
  ContainerRecommendationResponse,
} from './contract';
import {
  mockGetCommodityDashboard,
  mockGetCommodityDetail,
  mockGetCustomers,
  mockGetContainerMix,
  mockRecommendContainer,
} from '../mocks/handlers';

const USE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('dip_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }

  return res.json();
}

// ─── Commodity Dashboard ────────────────────────────────────────────────────

export async function getCommodityDashboard(): Promise<CommodityDashboard> {
  if (USE_MOCKS) return mockGetCommodityDashboard();
  return apiFetch('/commodity/dashboard');
}

export async function getCommodityDetail(commodityCode: string): Promise<CommodityDetail> {
  if (USE_MOCKS) return mockGetCommodityDetail(commodityCode);
  return apiFetch(`/commodity/${commodityCode}`);
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<CustomerSummary[]> {
  if (USE_MOCKS) return mockGetCustomers();
  return apiFetch('/customers');
}

// ─── Containers ──────────────────────────────────────────────────────────────

export async function getContainerMix(filters: ContainerMixFilters): Promise<ContainerMixData> {
  if (USE_MOCKS) return mockGetContainerMix(filters);
  const params = new URLSearchParams();
  if (filters.customerId) params.set('customerId', filters.customerId);
  if (filters.commodityCode) params.set('commodityCode', filters.commodityCode);
  if (filters.regionCode) params.set('regionCode', filters.regionCode);
  if (filters.year) params.set('year', String(filters.year));
  return apiFetch(`/containers/mix?${params}`);
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export async function recommendContainer(req: ContainerRecommendationRequest): Promise<ContainerRecommendationResponse> {
  if (USE_MOCKS) return mockRecommendContainer(req);
  return apiFetch('/recommend/container', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
