import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Download } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TopBar } from '../components/layout/TopBar';
import { KpiCard } from '../components/shared/KpiCard';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getPortfolioOverview } from '../lib/api/client';
import { formatNumber } from '../lib/utils';

export function DashboardOverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portfolioOverview'],
    queryFn: getPortfolioOverview,
  });

  return (
    <>
      <TopBar title="Portfolio Overview" />
      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Failed to load portfolio data" onRetry={() => refetch()} />}
        {data && (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[28px] font-bold text-text-primary">
                  Portfolio Overview
                </h1>
                <p className="font-body text-sm text-text-secondary">
                  Real-time logistics demand intelligence across all regions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 h-9 px-4 border border-border-light font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">
                  <Calendar size={14} />
                  LAST 30 DAYS
                </button>
                <button className="flex items-center gap-2 h-9 px-4 bg-text-primary font-heading text-[11px] font-semibold text-text-on-dark tracking-[1px]">
                  <Download size={14} />
                  EXPORT
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="flex gap-5">
              <KpiCard label="Total TEU (12M)" value={formatNumber(data.totalTeu12m)} change={8.2} />
              <KpiCard label="Forecast TEU (6M)" value={formatNumber(data.forecastTeu6m)} change={3.1} />
              <KpiCard label="High-Potential Customers" value={String(data.highPotentialCustomers)} />
              <KpiCard label="40HC Share" value={`${data.hcSharePercent}%`} change={2.7} />
            </div>

            {/* Charts Row */}
            <div className="flex gap-5">
              {/* TEU Trend Chart */}
              <div className="flex-1 bg-card p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-text-primary">Demand Trend</h3>
                  <div className="flex">
                    <span className="px-3.5 py-1.5 bg-text-primary font-heading text-[10px] font-semibold text-text-on-dark tracking-[1px]">WEEKLY</span>
                    <span className="px-3.5 py-1.5 border border-border-light font-heading text-[10px] font-semibold text-text-secondary tracking-[1px]">MONTHLY</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.monthlyTeu}>
                    <CartesianGrid stroke="#D1CCC4" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: 'none', background: '#1a1a1a', color: '#F5F3EF' }}
                      labelStyle={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}
                    />
                    <Line type="monotone" dataKey="bookedTeu" stroke="#C05A3C" strokeWidth={2} dot={{ r: 3, fill: '#C05A3C' }} name="Booked TEU" />
                    <Line type="monotone" dataKey="forecastTeu" stroke="#5C7C8A" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#5C7C8A' }} name="Forecast TEU" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Customers */}
              <div className="w-[380px] min-w-[380px] bg-card p-6 flex flex-col gap-5">
                <h3 className="font-heading text-lg font-bold text-text-primary">Top Customers</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topCustomers} layout="vertical" onClick={(e) => {
                    if (e?.activePayload?.[0]?.payload?.customerId) {
                      navigate(`/customers?selected=${e.activePayload[0].payload.customerId}`);
                    }
                  }}>
                    <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="customerName" type="category" width={110} tick={{ fontSize: 11, fontFamily: 'Inter', fill: '#555' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: 'none', background: '#1a1a1a', color: '#F5F3EF' }}
                      formatter={(value: number) => [
                        `${formatNumber(value)} TEU`,
                        'Forecast'
                      ]}
                    />
                    <Bar dataKey="forecastTeu" fill="#C05A3C" cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming Peaks Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-text-primary">Upcoming Seasonal Peaks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">CUSTOMER</th>
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">REGION</th>
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">PEAK MONTH</th>
                      <th className="text-right py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">EXPECTED TEU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcomingPeaks.map((peak) => (
                      <tr
                        key={peak.customerId + peak.peakMonth}
                        className="border-b border-border-light last:border-b-0 cursor-pointer hover:bg-page transition-colors"
                        onClick={() => navigate(`/customers?selected=${peak.customerId}`)}
                      >
                        <td className="py-3 px-4 font-heading text-[13px] font-semibold text-text-primary">{peak.customerName}</td>
                        <td className="py-3 px-4 font-body text-[13px] text-text-primary">{peak.region}</td>
                        <td className="py-3 px-4 font-body text-[13px] text-text-muted">{peak.peakMonth}</td>
                        <td className="py-3 px-4 font-heading text-[13px] font-semibold text-text-primary text-right">{formatNumber(peak.expectedTeu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
