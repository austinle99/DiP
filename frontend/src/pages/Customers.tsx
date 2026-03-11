import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, Pencil } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TopBar } from '../components/layout/TopBar';
import { KpiCard } from '../components/shared/KpiCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getCustomers, getCustomerDetail } from '../lib/api/client';
import { useCustomerStore } from '../lib/store';
import { formatNumber, formatCurrency, formatPercent, cn } from '../lib/utils';

export function CustomersPage() {
  const [searchParams] = useSearchParams();
  const {
    selectedCustomerId, setSelectedCustomerId,
    customerSearch, setCustomerSearch,
  } = useCustomerStore();

  const { data: customers, isLoading: customersLoading, isError: customersError, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const { data: detail, isLoading: detailLoading, isError: detailError, refetch: refetchDetail } = useQuery({
    queryKey: ['customerDetail', selectedCustomerId],
    queryFn: () => getCustomerDetail(selectedCustomerId!),
    enabled: !!selectedCustomerId,
  });

  // Handle URL param ?selected=CUST_X
  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected && customers?.some(c => c.customerId === selected)) {
      setSelectedCustomerId(selected);
    } else if (!selectedCustomerId && customers?.length) {
      setSelectedCustomerId(customers[0].customerId);
    }
  }, [searchParams, customers, selectedCustomerId, setSelectedCustomerId]);

  const filteredCustomers = customers?.filter(c =>
    c.customerName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <>
      <TopBar title="Customer 360 Logistics" />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel — Customer List */}
        <div className="w-[300px] min-w-[300px] h-full bg-white border-r border-border-light flex flex-col">
          <div className="p-5 pb-4 flex flex-col gap-3">
            <h3 className="font-heading text-base font-bold text-text-primary">Customers</h3>
            <div className="flex items-center gap-2 bg-card h-9 px-3">
              <Search size={16} className="text-text-muted" />
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="flex-1 bg-transparent text-[13px] font-body text-text-primary placeholder:text-text-muted outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {customersLoading && <LoadingState message="Loading customers..." />}
            {customersError && <ErrorState message="Failed to load" onRetry={() => refetchCustomers()} />}
            {filteredCustomers?.map((c) => (
              <button
                key={c.customerId}
                onClick={() => setSelectedCustomerId(c.customerId)}
                className={cn(
                  'w-full flex items-center gap-3 h-16 px-5 text-left transition-colors',
                  selectedCustomerId === c.customerId
                    ? 'bg-page border-l-[3px] border-l-accent'
                    : 'border-b border-border-light hover:bg-page/50',
                )}
              >
                <div className={cn(
                  'w-9 h-9 min-w-[36px]',
                  selectedCustomerId === c.customerId ? 'bg-sidebar' : 'bg-border-light',
                )} />
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="font-heading text-[13px] font-semibold text-text-primary truncate">{c.customerName}</span>
                  <span className="font-body text-[11px] text-text-muted">{c.tier}  ·  {c.region}</span>
                </div>
                <span className={cn(
                  'font-heading text-xs font-semibold',
                  selectedCustomerId === c.customerId ? 'text-accent' : 'text-text-secondary',
                )}>
                  {formatNumber(c.totalTeu)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel — Customer Detail */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {detailLoading && <LoadingState message="Loading customer details..." />}
          {detailError && <ErrorState message="Failed to load customer details" onRetry={() => refetchDetail()} />}
          {detail && (
            <>
              {/* Profile Card */}
              <div className="flex items-center gap-5 bg-card p-6">
                <div className="w-14 h-14 bg-sidebar" />
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-heading text-xl font-bold text-text-primary">{detail.customerName}</span>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-accent font-heading text-[10px] font-semibold text-text-on-dark tracking-[1px]">{detail.tier.toUpperCase()}</span>
                    <span className="font-body text-[13px] text-text-secondary">{detail.region}  ·  Since {detail.since}</span>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 h-[34px] px-4 border border-border-light font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">
                  <Pencil size={14} />
                  EDIT
                </button>
              </div>

              {/* KPI Cards */}
              <div className="flex gap-5">
                <KpiCard label="Lifetime Value" value={formatCurrency(detail.lifetimeValue)} change={detail.lifetimeValueChange} changeSuffix="% YoY" />
                <KpiCard label="Shipments YTD" value={formatNumber(detail.shipmentsYtd)} change={detail.shipmentsYtdChange} />
                <KpiCard label="On-Time Rate" value={formatPercent(detail.onTimeRate)} change={detail.onTimeRateChange} />
                <KpiCard label="Avg Order Value" value={formatCurrency(detail.avgOrderValue)} change={detail.avgOrderValueChange} />
              </div>

              {/* Charts Row */}
              <div className="flex gap-5">
                {/* TEU Line Chart */}
                <div className="flex-1 bg-card p-6 flex flex-col gap-5">
                  <h3 className="font-heading text-lg font-bold text-text-primary">TEU by Month</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={detail.monthlyTeu}>
                      <CartesianGrid stroke="#D1CCC4" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: 'none', background: '#1a1a1a', color: '#F5F3EF' }} />
                      <Line type="monotone" dataKey="bookedTeu" stroke="#C05A3C" strokeWidth={2} dot={{ r: 3, fill: '#C05A3C' }} name="Booked TEU" />
                      <Line type="monotone" dataKey="forecastTeu" stroke="#5C7C8A" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#5C7C8A' }} name="Forecast TEU" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Container Mix Stacked Bar */}
                <div className="flex-1 bg-card p-6 flex flex-col gap-5">
                  <h3 className="font-heading text-lg font-bold text-text-primary">Container Mix</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={detail.containerMix}>
                      <CartesianGrid stroke="#D1CCC4" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fontFamily: 'Space Grotesk', fill: '#888' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: 'none', background: '#1a1a1a', color: '#F5F3EF' }} />
                      <Bar dataKey="teu20gp" stackId="a" fill="#C05A3C" name="20GP" />
                      <Bar dataKey="teu40hc" stackId="a" fill="#5C7C8A" name="40HC" />
                      <Bar dataKey="teuOther" stackId="a" fill="#D1CCC4" name="Other" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-card p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-text-primary">Recent Shipments</h3>
                  <span className="font-heading text-[11px] font-semibold text-accent tracking-[1px] cursor-pointer">VIEW ALL</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">SHIPMENT ID</th>
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">ORIGIN</th>
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">DESTINATION</th>
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">STATUS</th>
                      <th className="text-left py-2.5 px-4 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.recentBookings.map((b) => (
                      <tr key={b.shipmentId} className="border-b border-border-light last:border-b-0">
                        <td className="py-3 px-4 font-heading text-[13px] font-semibold text-text-primary">{b.shipmentId}</td>
                        <td className="py-3 px-4 font-body text-[13px] text-text-primary">{b.origin}</td>
                        <td className="py-3 px-4 font-body text-[13px] text-text-primary">{b.destination}</td>
                        <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                        <td className="py-3 px-4 font-body text-[13px] text-text-muted">{b.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!selectedCustomerId && !detailLoading && (
            <div className="flex-1 flex items-center justify-center text-text-muted font-heading text-sm tracking-[1px]">
              SELECT A CUSTOMER FROM THE LIST
            </div>
          )}
        </div>
      </div>
    </>
  );
}
