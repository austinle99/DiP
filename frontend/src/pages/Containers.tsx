import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TopBar } from '../components/layout/TopBar';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getContainerMix, getCustomers } from '../lib/api/client';
import { useContainerFiltersStore } from '../lib/store';
import { formatNumber, cn } from '../lib/utils';

const PIE_COLORS = ['#C05A3C', '#5C7C8A', '#4A7C59', '#C05A3C80', '#888888'];
const BAR_COLORS = { teu20gp: '#C05A3C', teu40hc: '#5C7C8A', teuOther: '#D1CCC4' };

export function ContainersPage() {
  const navigate = useNavigate();
  const { customerId, tradeLane, year, setCustomerId, setTradeLane, setYear } = useContainerFiltersStore();

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['containerMix', customerId, tradeLane, year],
    queryFn: () => getContainerMix({ customerId, tradeLane, year }),
  });

  const tradeLanes = ['Asia–Europe', 'Trans-Pacific', 'Intra-Asia', 'Latin America'];

  return (
    <>
      <TopBar title="Container Mix & Seasonality" />
      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-bold text-text-primary">Container Mix & Seasonality</h1>
          <p className="font-body text-sm text-text-secondary">Analyze container type distribution and seasonal demand patterns</p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4">
          <select
            value={customerId || ''}
            onChange={(e) => setCustomerId(e.target.value || undefined)}
            className="h-9 px-4 bg-card border-0 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] outline-none cursor-pointer"
          >
            <option value="">ALL CUSTOMERS</option>
            {customers?.map(c => (
              <option key={c.customerId} value={c.customerId}>{c.customerName.toUpperCase()}</option>
            ))}
          </select>
          <select
            value={tradeLane || ''}
            onChange={(e) => setTradeLane(e.target.value || undefined)}
            className="h-9 px-4 bg-card border-0 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] outline-none cursor-pointer"
          >
            <option value="">ALL TRADE LANES</option>
            {tradeLanes.map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 px-4 bg-card border-0 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] outline-none cursor-pointer"
          >
            {[2026, 2025, 2024].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Failed to load container data" onRetry={() => refetch()} />}
        {data && (
          <>
            {/* Charts Row */}
            <div className="flex gap-5">
              {/* Container Type Distribution */}
              <div className="flex-1 bg-card p-6 flex flex-col gap-5">
                <h3 className="font-heading text-lg font-bold text-text-primary">Container Type Distribution</h3>
                <div className="flex flex-col gap-4">
                  {data.yearlyShare.map((item, i) => (
                    <div key={item.type} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5" style={{ backgroundColor: PIE_COLORS[i] }} />
                          <span className="font-body text-sm text-text-primary">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-heading text-sm font-bold text-text-primary">{item.percent}%</span>
                          <span className="font-heading text-[13px] text-text-muted">{formatNumber(item.teu)}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-border-light">
                        <div className="h-2" style={{ width: `${item.percent}%`, backgroundColor: PIE_COLORS[i] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonality Panel */}
              <div className="w-[420px] min-w-[420px] bg-card p-6 flex flex-col gap-5">
                <h3 className="font-heading text-lg font-bold text-text-primary">Seasonal Demand Index</h3>
                <div className="flex flex-col gap-3">
                  {data.seasonalIndex.map((s) => {
                    const isPeak = s.index === Math.max(...data.seasonalIndex.map(x => x.index));
                    return (
                      <div key={s.quarter} className={cn(
                        'flex items-center justify-between py-2.5 border-b border-border-light last:border-b-0',
                      )}>
                        <span className="font-body text-sm text-text-primary">{s.quarter} — {s.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-[100px] h-2 bg-border-light">
                            <div className="h-2" style={{ width: `${s.index}%`, backgroundColor: isPeak ? '#C05A3C' : '#5C7C8A' }} />
                          </div>
                          <span className={cn(
                            'font-heading text-sm font-bold w-8 text-right',
                            isPeak ? 'text-accent' : 'text-text-primary',
                          )}>
                            {s.index}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Peak Insight Box */}
                {(() => {
                  const peak = data.seasonalIndex.reduce((a, b) => a.index > b.index ? a : b);
                  return (
                    <div className="bg-sidebar p-5 flex flex-col gap-2">
                      <span className="font-heading text-[10px] font-semibold text-accent tracking-[1px]">PEAK SEASON</span>
                      <span className="font-heading text-xl font-bold text-text-on-dark">{peak.quarter} {peak.label}</span>
                      <span className="font-body text-[13px] text-text-tertiary leading-relaxed">
                        Highest demand driven by pre-holiday stocking across Asia Pacific and European routes.
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Monthly Volume Chart */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-text-primary">Monthly Volume Trend (12 Months)</h3>
                <span className="font-heading text-[11px] font-semibold text-text-muted tracking-[1px]">TEU VOLUME</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyMix}>
                  <CartesianGrid stroke="#D1CCC4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: 'none', background: '#1a1a1a', color: '#F5F3EF' }} />
                  <Bar dataKey="teu20gp" stackId="a" fill={BAR_COLORS.teu20gp} name="20GP" />
                  <Bar dataKey="teu40hc" stackId="a" fill={BAR_COLORS.teu40hc} name="40HC" />
                  <Bar dataKey="teuOther" stackId="a" fill={BAR_COLORS.teuOther} name="Other" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mix by Customer Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <h3 className="font-heading text-lg font-bold text-text-primary">Container Mix by Customer</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">CUSTOMER</th>
                    <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MONTH</th>
                    <th className="text-right py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">20GP</th>
                    <th className="text-right py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">40HC</th>
                    <th className="text-right py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">OTHER</th>
                    <th className="text-right py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mixByCustomerMonth.map((row) => (
                    <tr
                      key={row.customerId + row.month}
                      className="border-b border-border-light last:border-b-0 cursor-pointer hover:bg-page transition-colors"
                      onClick={() => navigate(`/customers?selected=${row.customerId}`)}
                    >
                      <td className="py-3 px-4 font-heading text-[13px] font-semibold text-text-primary">{row.customerName}</td>
                      <td className="py-3 px-4 font-body text-[13px] text-text-muted">{row.month}</td>
                      <td className="py-3 px-4 font-heading text-[13px] text-text-primary text-right">{formatNumber(row.teu20gp)}</td>
                      <td className="py-3 px-4 font-heading text-[13px] text-text-primary text-right">{formatNumber(row.teu40hc)}</td>
                      <td className="py-3 px-4 font-heading text-[13px] text-text-primary text-right">{formatNumber(row.teuOther)}</td>
                      <td className="py-3 px-4 font-heading text-[13px] font-semibold text-text-primary text-right">{formatNumber(row.teu20gp + row.teu40hc + row.teuOther)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
