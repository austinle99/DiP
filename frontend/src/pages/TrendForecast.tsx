import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { KpiCard } from '../components/shared/KpiCard';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getCommodityDashboard } from '../lib/api/client';
import { formatNumber, cn } from '../lib/utils';

export function TrendForecastPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['commodityDashboard'],
    queryFn: getCommodityDashboard,
  });

  const topGrowing = data?.seasonalForecasts.reduce((a, b) =>
    a.changePercent > b.changePercent ? a : b
  );

  const totalContainers = data?.seasonalForecasts.reduce((sum, f) =>
    sum + Math.ceil(f.nextMonthTeu / 2), 0
  ) ?? 0;

  return (
    <>
      <TopBar title="Xu hướng Mặt hàng" />
      <main className="flex-1 p-8 overflow-y-auto space-y-7">
        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Không thể tải dữ liệu" onRetry={() => refetch()} />}
        {data && (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[28px] font-bold text-text-primary">
                  Cơ hội Tháng tới — Mặt hàng nào cần tìm khách?
                </h1>
                <p className="font-body text-sm text-text-secondary">
                  Dự báo xu hướng tăng/giảm để Sales chủ động tiếp cận nhà xuất khẩu trước mùa cao điểm
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 h-9 px-4 border border-border-light font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">
                  <Calendar size={14} />
                  THÁNG 4/2026
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
                label="TỔNG NHU CẦU THÁNG TỚI"
                value={`${formatNumber(data.kpi.nextMonthForecastTeu)} TEU`}
              />
              <KpiCard
                label="CẦN TÌM KHÁCH GẤP — MẶT HÀNG"
                value={topGrowing?.commodityName ?? '—'}
                accentValue
              />
              <KpiCard
                label="SỐ CONTAINER CẦN BÁN"
                value={formatNumber(totalContainers)}
                subtitle="cont."
              />
            </div>

            {/* Forecast Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Chi tiết Cơ hội — Mặt hàng × Địa điểm
                </h3>
                {topGrowing && (
                  <span className="px-2.5 py-1 bg-accent font-heading text-[10px] font-semibold text-text-on-dark tracking-[1px]">
                    ƯU TIÊN: {topGrowing.commodityName.toUpperCase()} +{topGrowing.changePercent}%
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MẶT HÀNG</th>
                      <th className="text-right py-2.5 w-[90px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">HIỆN TẠI</th>
                      <th className="text-right py-2.5 w-[90px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">DỰ BÁO</th>
                      <th className="text-right py-2.5 w-[100px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">CONTAINER</th>
                      <th className="text-right py-2.5 w-[100px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">THAY ĐỔI</th>
                      <th className="text-left py-2.5 w-[130px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] pl-4">VÙNG CẦN KHAI THÁC</th>
                      <th className="text-center py-2.5 w-[70px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MỨC ĐỘ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.seasonalForecasts.map((f) => (
                      <tr
                        key={f.commodityCode}
                        className="border-b border-border-light last:border-b-0 hover:bg-page transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5" style={{
                              backgroundColor: f.trend === 'UP' ? '#5C7C8A' : f.trend === 'DOWN' ? '#C05A3C' : '#888',
                            }} />
                            <span className="font-heading text-[13px] font-semibold text-text-primary">{f.commodityName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] text-text-primary">
                          {formatNumber(f.currentMonthTeu)}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-bold text-text-primary">
                          {formatNumber(f.nextMonthTeu)}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-text-primary">
                          {Math.ceil(f.nextMonthTeu / 2)}
                        </td>
                        <td className={cn(
                          'py-3 text-right font-heading text-[13px] font-semibold',
                          f.changePercent > 0 ? 'text-success' : f.changePercent < 0 ? 'text-error' : 'text-text-muted',
                        )}>
                          {f.changePercent > 0 ? '+' : ''}{f.changePercent}%
                        </td>
                        <td className="py-3 pl-4 font-body text-[13px] text-text-primary">
                          {f.region}
                        </td>
                        <td className="py-3 text-center">
                          {f.trend === 'UP' && <TrendingUp size={16} className="text-success mx-auto" />}
                          {f.trend === 'DOWN' && <TrendingDown size={16} className="text-error mx-auto" />}
                          {f.trend === 'STABLE' && <Minus size={16} className="text-text-muted mx-auto" />}
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
