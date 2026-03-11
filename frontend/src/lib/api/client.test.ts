import { describe, it, expect } from 'vitest';
import { getPortfolioOverview, getCustomers } from './client';

describe('API client (mock)', () => {
  it('returns portfolio overview data', async () => {
    const data = await getPortfolioOverview();
    expect(data).toBeDefined();
    expect(data.totalTeu12m).toBeDefined();
    expect(data.monthlyTeu.length).toBeGreaterThan(0);
  });

  it('returns a list of customers', async () => {
    const customers = await getCustomers();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThan(0);
  });
});
