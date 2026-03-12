import { useQuery } from '@tanstack/react-query';
import { Calendar, Download } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { KpiCard } from '../components/shared/KpiCard';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getCommodityDashboard } from '../lib/api/client';
import { formatNumber } from '../lib/utils';

const SALES_SUGGESTIONS: Record<string, string> = {
  'Dry 40HC': 'Chào NXK gạo Miền Nam',
  'Dry 20GP': 'Chào NXK cà phê M.Trung',
  'Reefer 40': 'Chào NXK thủy sản M.Trung',
  'Reefer 20': 'Combo Reefer cho NXK tôm',
  'Open Top': 'Chào NXK gỗ Miền Nam',
  'Flat Rack': 'Chào NXK máy móc M.Bắc',
};

export function ContainerAnalysisPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['commodityDashboard'],
    queryFn: getCommodityDashboard,
  });

  const topContainer = data?.containerDemand[0];
  const totalContainers = data?.containerDemand.reduce((sum, c) => sum + c.teu, 0) ?? 0;
  const reeferPercent = data?.containerDemand
    .filter(c => c.containerType.toLowerCase().includes('reefer'))
    .reduce((sum, c) => sum + c.percent, 0) ?? 0;

  return (
    <>
      <TopBar title="Phân tích Container" />
      <main className="flex-1 p-8 overflow-y-auto space-y-7">
        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Không thể tải dữ liệu" onRetry={() => refetch()} />}
        {data && (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[28px] font-bold text-text-primary">
                  Nhu cầu Container — Loại nào cần bán?
                </h1>
                <p className="font-body text-sm text-text-secondary">
                  Phân tích nhu cầu container theo mặt hàng — Sales biết chào loại container phù hợp cho từng khách
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 h-9 px-4 border border-border-light font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">
                  <Calendar size={14} />
                  12 THÁNG
                </button>
                <button className="flex items-center gap-2 h-9 px-4 bg-text-primary font-heading text-[11px] font-semibold text-text-on-dark tracking-[1px]">
                  <Download size={14} />
                  XUẤT BÁO CÁO
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="flex gap-5">
              <KpiCard
                label="CONTAINER PHỔ BIẾN NHẤT"
                value={topContainer?.containerType ?? '—'}
                subtitle={`${topContainer?.percent ?? 0}% tổng nhu cầu`}
              />
              <KpiCard
                label="TỔNG CONTAINER DỰ BÁO (6T)"
                value={formatNumber(Math.ceil(totalContainers / 2))}
                change={8.4}
                subtitle="so với kỳ trước"
              />
              <KpiCard
                label="KHO LẠNH (REEFER) CẦN BÁN"
                value={`${reeferPercent}%`}
                accentValue
                subtitle="Thủy sản + Nông sản lạnh"
              />
            </div>

            {/* Container Demand Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Nhu cầu Container theo Mặt hàng — Sales chào gì cho khách?
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">LOẠI CONTAINER</th>
                      <th className="text-left py-2.5 w-[100px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">CHẤT LƯỢNG</th>
                      <th className="text-right py-2.5 w-[120px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">SỐ LƯỢNG (TEU)</th>
                      <th className="text-right py-2.5 w-[90px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">TỶ TRỌNG</th>
                      <th className="text-left py-2.5 w-[140px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] pl-4">MẶT HÀNG CHÍNH</th>
                      <th className="text-left py-2.5 w-[200px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">GỢI Ý BÁN HÀNG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.containerDemand.map((c) => (
                      <tr
                        key={c.containerType}
                        className="border-b border-border-light last:border-b-0 hover:bg-page transition-colors"
                      >
                        <td className="py-3 font-heading text-[13px] font-semibold text-text-primary">
                          {c.containerType}
                        </td>
                        <td className="py-3 font-heading text-[11px] font-semibold text-text-muted">
                          {c.qualityGrade}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-text-primary">
                          {formatNumber(c.teu)}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-text-primary">
                          {c.percent}%
                        </td>
                        <td className="py-3 pl-4 font-body text-[13px] text-text-primary">
                          {c.topCommodity}
                        </td>
                        <td className="py-3 font-body text-[12px] font-semibold text-accent">
                          {SALES_SUGGESTIONS[c.containerType] ?? `Chào NXK ${c.topCommodity}`}
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
