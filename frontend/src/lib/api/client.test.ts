import { describe, it, expect } from 'vitest';
import { getCommodityDashboard, getCustomers } from './client';

describe('API client (mock)', () => {
  it('returns commodity dashboard data', async () => {
    const data = await getCommodityDashboard();
    expect(data).toBeDefined();
    expect(data.kpi.totalVolumeTeu).toBeDefined();
    expect(data.commodityRankings.length).toBeGreaterThan(0);
  });

  it('returns a list of customers', async () => {
    const customers = await getCustomers();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThan(0);
  });
});
