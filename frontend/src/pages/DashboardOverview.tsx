import { useQuery } from '@tanstack/react-query';
import { Calendar, Download } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { KpiCard } from '../components/shared/KpiCard';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getCommodityDashboard } from '../lib/api/client';
import { formatNumber } from '../lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  NONG_SAN: 'Nông sản',
  THUY_SAN: 'Thủy sản',
  CONG_NGHIEP: 'Công nghiệp',
  TIEU_DUNG: 'Tiêu dùng',
  VAT_LIEU: 'Vật liệu',
};

export function DashboardOverviewPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['commodityDashboard'],
    queryFn: getCommodityDashboard,
  });

  const growingCount = data?.commodityRankings.filter(c => c.growthPercent > 0).length ?? 0;
  const totalCount = data?.commodityRankings.length ?? 0;

  return (
    <>
      <TopBar title="Phân tích Nhu cầu Mặt hàng" />
      <main className="flex-1 p-8 overflow-y-auto space-y-7">
        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Không thể tải dữ liệu" onRetry={() => refetch()} />}
        {data && (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[28px] font-bold text-text-primary">
                  Nhu cầu Thị trường — Tìm khách hàng mới
                </h1>
                <p className="font-body text-sm text-text-secondary">
                  Phân tích sản lượng mặt hàng để xác định cơ hội tiếp cận khách hàng tiềm năng
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
                label="TỔNG NHU CẦU THỊ TRƯỜNG (12T)"
                value={`${formatNumber(data.kpi.totalVolumeTeu)} TEU`}
                subtitle="so với cùng kỳ"
                change={12.3}
              />
              <KpiCard
                label="MẶT HÀNG TIỀM NĂNG NHẤT"
                value={`${formatNumber(data.kpi.topCommodityVolume)} TEU`}
                subtitle={`${data.kpi.topCommodityName} — tăng trưởng mạnh nhất`}
              />
              <KpiCard
                label="MẶT HÀNG ĐANG TĂNG TRƯỞNG"
                value={`${growingCount}/${totalCount}`}
                accentValue
              />
              <KpiCard
                label="CƠ HỘI TIẾP CẬN MỚI"
                value={String(data.kpi.activeRegions + 2)}
                accentValue
                subtitle="khu vực chưa khai thác"
              />
            </div>

            {/* Commodity Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Xếp hạng Mặt hàng — Cơ hội theo Sản lượng
                </h3>
                <span className="font-heading text-[10px] font-semibold text-text-muted tracking-[1px]">
                  SẢN LƯỢNG CAO = NHIỀU KHÁCH HÀNG TIỀM NĂNG
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 w-[30px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">#</th>
                      <th className="text-left py-2.5 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MẶT HÀNG</th>
                      <th className="text-left py-2.5 w-[120px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">PHÂN LOẠI</th>
                      <th className="text-right py-2.5 w-[110px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">SẢN LƯỢNG</th>
                      <th className="text-right py-2.5 w-[120px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">TĂNG TRƯỞNG ⬆</th>
                      <th className="text-left py-2.5 w-[130px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] pl-4">VÙNG CẦN KHAI THÁC</th>
                      <th className="text-left py-2.5 w-[100px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MÙA CAO ĐIỂM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commodityRankings.map((c, i) => (
                      <tr
                        key={c.commodityCode}
                        className="border-b border-border-light last:border-b-0 hover:bg-page transition-colors"
                      >
                        <td className="py-3 font-heading text-[13px] font-bold text-text-muted">{i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-accent" />
                            <span className="font-heading text-[13px] font-semibold text-text-primary">{c.commodityName}</span>
                          </div>
                        </td>
                        <td className="py-3 font-heading text-[11px] font-semibold text-text-muted">
                          {CATEGORY_LABELS[c.category] ?? c.category}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-text-primary">
                          {formatNumber(c.totalTeu)} TEU
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-success">
                          +{c.growthPercent}%
                        </td>
                        <td className="py-3 pl-4 font-body text-[13px] text-text-primary">
                          {c.topRegion}
                        </td>
                        <td className="py-3 font-body text-[13px] text-text-muted">
                          {c.seasonalPeak}
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
