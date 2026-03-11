import type {
  PortfolioOverview,
  CustomerSummary,
  CustomerDetail,
  ContainerMixFilters,
  ContainerMixData,
} from './contract';
import {
  mockGetPortfolioOverview,
  mockGetCustomers,
  mockGetCustomerDetail,
  mockGetContainerMix,
} from '../mocks/handlers';

// API client — currently wired to mocks, swap to fetch() when backend is ready

export async function getPortfolioOverview(): Promise<PortfolioOverview> {
  return mockGetPortfolioOverview();
}

export async function getCustomers(): Promise<CustomerSummary[]> {
  return mockGetCustomers();
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail> {
  return mockGetCustomerDetail(customerId);
}

export async function getContainerMix(filters: ContainerMixFilters): Promise<ContainerMixData> {
  return mockGetContainerMix(filters);
}
