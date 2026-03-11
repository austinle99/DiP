import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@dip.local' },
    update: {},
    create: { email: 'admin@dip.local', passwordHash: adminPassword, name: 'Admin User', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'analyst@dip.local' },
    update: {},
    create: { email: 'analyst@dip.local', passwordHash: await bcrypt.hash('analyst123!', 12), name: 'Analyst User', role: 'ANALYST' },
  });

  // ─── Customers ─────────────────────────────────────────────────────────────
  const customersData = [
    { externalId: 'CUST-001', name: 'Maersk Line', tier: 'TIER_1' as const, region: 'Asia–Europe', since: 2018 },
    { externalId: 'CUST-002', name: 'CMA CGM Group', tier: 'TIER_1' as const, region: 'Trans-Pacific', since: 2019 },
    { externalId: 'CUST-003', name: 'Hapag-Lloyd', tier: 'TIER_1' as const, region: 'Asia–Europe', since: 2020 },
    { externalId: 'CUST-004', name: 'ONE Network', tier: 'TIER_1' as const, region: 'Intra-Asia', since: 2021 },
    { externalId: 'CUST-005', name: 'Evergreen Marine', tier: 'TIER_2' as const, region: 'Trans-Pacific', since: 2019 },
    { externalId: 'CUST-006', name: 'Yang Ming', tier: 'TIER_2' as const, region: 'Intra-Asia', since: 2020 },
    { externalId: 'CUST-007', name: 'ZIM Integrated', tier: 'TIER_2' as const, region: 'Latin America', since: 2021 },
    { externalId: 'CUST-008', name: 'PIL Pacific', tier: 'TIER_3' as const, region: 'Intra-Asia', since: 2022 },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { externalId: c.externalId },
      update: {},
      create: c,
    });
    customers.push(customer);
  }

  // ─── TEU Records (18 months) ───────────────────────────────────────────────
  const months = [];
  for (let i = -12; i <= 5; i++) {
    const d = new Date(2026, 2 + i, 1); // March 2026 as anchor
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  for (const customer of customers) {
    const baseTeu = customer.tier === 'TIER_1' ? 350 : customer.tier === 'TIER_2' ? 200 : 50;

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const seasonal = 1 + 0.15 * Math.sin((i / 12) * 2 * Math.PI);
      const noise = 0.9 + Math.random() * 0.2;
      const bookedTeu = i <= 12 ? Math.round(baseTeu * seasonal * noise) : 0;
      const forecastTeu = i >= 10 ? Math.round(baseTeu * seasonal * noise * 1.08) : null;

      await prisma.teuRecord.upsert({
        where: { customerId_month: { customerId: customer.id, month } },
        update: {},
        create: { customerId: customer.id, month, bookedTeu, forecastTeu },
      });
    }
  }

  // ─── Container Mixes (12 months) ──────────────────────────────────────────
  const tradeLanes = ['Asia–Europe', 'Trans-Pacific', 'Intra-Asia', 'Latin America'];

  for (const customer of customers) {
    const lane = tradeLanes.find((t) => t === customer.region) ?? 'Intra-Asia';
    const baseTeu = customer.tier === 'TIER_1' ? 350 : customer.tier === 'TIER_2' ? 200 : 50;

    for (let i = 0; i < 12; i++) {
      const month = months[i];
      const total = baseTeu * (0.85 + Math.random() * 0.3);
      const hcRatio = 0.55 + Math.random() * 0.15;
      const gpRatio = 0.25 + Math.random() * 0.1;

      await prisma.containerMix.upsert({
        where: { customerId_month_tradeLane: { customerId: customer.id, month, tradeLane: lane } },
        update: {},
        create: {
          customerId: customer.id,
          month,
          tradeLane: lane,
          teu20gp: Math.round(total * gpRatio),
          teu40hc: Math.round(total * hcRatio),
          teuOther: Math.round(total * (1 - gpRatio - hcRatio)),
        },
      });
    }
  }

  // ─── Bookings ──────────────────────────────────────────────────────────────
  const routes = [
    { origin: 'Shanghai', destination: 'Rotterdam' },
    { origin: 'Busan', destination: 'Los Angeles' },
    { origin: 'Singapore', destination: 'Hamburg' },
    { origin: 'Ho Chi Minh', destination: 'Long Beach' },
    { origin: 'Ningbo', destination: 'Felixstowe' },
  ];
  const statuses: ('IN_TRANSIT' | 'PENDING' | 'DELIVERED' | 'DELAYED')[] = ['IN_TRANSIT', 'PENDING', 'DELIVERED', 'DELAYED'];

  let shipmentCounter = 10400;
  for (const customer of customers) {
    const numBookings = customer.tier === 'TIER_1' ? 5 : customer.tier === 'TIER_2' ? 3 : 2;
    for (let i = 0; i < numBookings; i++) {
      const route = routes[i % routes.length];
      const shipmentId = `SHP-${++shipmentCounter}`;
      const eta = new Date(2026, 2 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 28));

      await prisma.booking.upsert({
        where: { shipmentId },
        update: {},
        create: {
          shipmentId,
          customerId: customer.id,
          origin: route.origin,
          destination: route.destination,
          status: statuses[i % statuses.length],
          eta,
          teu: Math.round(20 + Math.random() * 200),
        },
      });
    }
  }

  // ─── Seasonal Indices ──────────────────────────────────────────────────────
  const quarters = [
    { quarter: 'Q1', index: 65, label: 'Q1 2026' },
    { quarter: 'Q2', index: 78, label: 'Q2 2026' },
    { quarter: 'Q3', index: 95, label: 'Q3 2026' },
    { quarter: 'Q4', index: 82, label: 'Q4 2026' },
  ];

  for (const lane of tradeLanes) {
    for (const q of quarters) {
      await prisma.seasonalIndex.upsert({
        where: { tradeLane_year_quarter: { tradeLane: lane, year: 2026, quarter: q.quarter } },
        update: {},
        create: {
          tradeLane: lane,
          year: 2026,
          quarter: q.quarter,
          label: q.label,
          index: q.index + Math.round(Math.random() * 10 - 5),
        },
      });
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
