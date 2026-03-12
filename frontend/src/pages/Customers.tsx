import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { KpiCard } from '../components/shared/KpiCard';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getCustomers } from '../lib/api/client';
import { formatNumber, cn } from '../lib/utils';

const TIER_COLORS: Record<string, string> = {
  'Tier 1': 'bg-accent text-text-on-dark',
  'Tier 2': 'bg-sidebar text-text-on-dark',
  'Tier 3': 'bg-border-light text-text-primary',
};

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data: customers, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const filtered = customers?.filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.topCommodity.toLowerCase().includes(search.toLowerCase())
  );

  const totalTeu = customers?.reduce((sum, c) => sum + c.totalTeu, 0) ?? 0;
  const mienNamCount = customers?.filter(c => c.region === 'Miền Nam').length ?? 0;
  const tier1Count = customers?.filter(c => c.tier === 'Tier 1').length ?? 0;

  return (
    <>
      <TopBar title="Khách hàng" />
      <main className="flex-1 p-8 overflow-y-auto space-y-7">
        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Không thể tải dữ liệu" onRetry={() => refetch()} />}
        {customers && (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[28px] font-bold text-text-primary">
                  Danh sách Khách hàng — Ai đang vận chuyển gì?
                </h1>
                <p className="font-body text-sm text-text-secondary">
                  Tổng hợp khách hàng theo sản lượng và mặt hàng — Sales theo dõi và tìm cơ hội cross-sell
                </p>
              </div>
              <button className="flex items-center gap-2 h-9 px-4 bg-text-primary font-heading text-[11px] font-semibold text-text-on-dark tracking-[1px]">
                <Download size={14} />
                XUẤT BÁO CÁO
              </button>
            </div>

            {/* KPI Cards */}
            <div className="flex gap-5">
              <KpiCard
                label="TỔNG KHÁCH HÀNG"
                value={String(customers.length)}
                subtitle="Đang hoạt động"
              />
              <KpiCard
                label="TỔNG SẢN LƯỢNG (TEU)"
                value={formatNumber(totalTeu)}
                change={9.2}
                subtitle="so với kỳ trước"
              />
              <KpiCard
                label="KHÁCH TIER 1"
                value={String(tier1Count)}
                accentValue
                subtitle="Khách hàng trọng điểm"
              />
              <KpiCard
                label="KHÁCH MIỀN NAM"
                value={String(mienNamCount)}
                subtitle={`${Math.round((mienNamCount / customers.length) * 100)}% tổng số`}
              />
            </div>

            {/* Customer Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Khách hàng — Sales cần theo dõi ai?
                </h3>
                <div className="flex items-center gap-2 bg-page h-9 px-3 w-[280px]">
                  <Search size={16} className="text-text-muted" />
                  <input
                    type="text"
                    placeholder="Tìm khách hàng hoặc mặt hàng..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] font-body text-text-primary placeholder:text-text-muted outline-none"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">#</th>
                      <th className="text-left py-2.5 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] pl-3">KHÁCH HÀNG</th>
                      <th className="text-left py-2.5 w-[100px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">TIER</th>
                      <th className="text-left py-2.5 w-[120px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">VÙNG MIỀN</th>
                      <th className="text-left py-2.5 w-[140px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MẶT HÀNG CHÍNH</th>
                      <th className="text-right py-2.5 w-[130px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">SẢN LƯỢNG (TEU)</th>
                      <th className="text-left py-2.5 w-[180px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] pl-4">GỢI Ý SALES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((c, i) => (
                      <tr
                        key={c.customerId}
                        className="border-b border-border-light last:border-b-0 hover:bg-page transition-colors"
                      >
                        <td className="py-3 font-heading text-[13px] font-semibold text-text-muted w-8">
                          {i + 1}
                        </td>
                        <td className="py-3 pl-3 font-heading text-[13px] font-semibold text-text-primary">
                          {c.customerName}
                        </td>
                        <td className="py-3">
                          <span className={cn(
                            'px-2 py-0.5 font-heading text-[10px] font-semibold tracking-[1px]',
                            TIER_COLORS[c.tier] ?? 'bg-border-light text-text-primary',
                          )}>
                            {c.tier.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 font-body text-[13px] text-text-primary">
                          {c.region}
                        </td>
                        <td className="py-3 font-body text-[13px] text-text-primary">
                          {c.topCommodity}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-text-primary">
                          {formatNumber(c.totalTeu)}
                        </td>
                        <td className="py-3 pl-4 font-body text-[12px] font-semibold text-accent">
                          {c.tier === 'Tier 1' ? 'Giữ chân — ưu đãi VIP' : c.tier === 'Tier 2' ? 'Nâng hạng — tăng volume' : 'Phát triển — cross-sell'}
                        </td>
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
