import { useQuery } from '@tanstack/react-query';
import { TopBar } from '../components/layout/TopBar';
import { LoadingState, ErrorState } from '../components/shared/LoadingState';
import { getCommodityDashboard } from '../lib/api/client';
import { formatNumber, cn } from '../lib/utils';

const REGION_COLORS: Record<string, string> = {
  MIEN_NAM: '#C05A3C',
  MIEN_BAC: '#5C7C8A',
  MIEN_TRUNG: '#4A7C59',
};

const REGION_COMMODITIES: Record<string, string> = {
  MIEN_NAM: 'Gạo, Dệt may, Cao su',
  MIEN_BAC: 'Điện tử, Dệt may',
  MIEN_TRUNG: 'Thủy sản, Cà phê',
};

const REGION_WAREHOUSES: Record<string, string> = {
  MIEN_NAM: 'Kho thường',
  MIEN_BAC: 'Kho thường',
  MIEN_TRUNG: 'Kho lạnh',
};

const REGION_CONTAINERS: Record<string, string> = {
  MIEN_NAM: 'Dry 40HC, 20GP',
  MIEN_BAC: 'Dry 40HC',
  MIEN_TRUNG: 'Reefer 40, 20',
};

export function RegionBreakdownPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['commodityDashboard'],
    queryFn: getCommodityDashboard,
  });

  const maxTeu = data ? Math.max(...data.regionDemands.map(r => r.totalTeu)) : 0;

  return (
    <>
      <TopBar title="Khai thác Vùng miền" />
      <main className="flex-1 p-8 overflow-y-auto space-y-7">
        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Không thể tải dữ liệu" onRetry={() => refetch()} />}
        {data && (
          <>
            {/* Page Header */}
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-[28px] font-bold text-text-primary">
                Khai thác theo Vùng miền — Tìm khách ở đâu?
              </h1>
              <p className="font-body text-sm text-text-secondary">
                Sales xác định vùng có nhu cầu cao để tập trung tìm kiếm nhà xuất khẩu/nhập khẩu mới
              </p>
            </div>

            {/* Region Cards */}
            <div className="flex gap-5">
              {data.regionDemands.map((region) => {
                const color = REGION_COLORS[region.regionCode] ?? '#888';
                const barWidth = maxTeu > 0 ? (region.totalTeu / maxTeu) * 100 : 0;

                return (
                  <div key={region.regionCode} className="flex-1 bg-card p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3" style={{ backgroundColor: color }} />
                        <span className="font-heading text-[13px] font-semibold text-text-primary">
                          {region.regionName}
                        </span>
                      </div>
                      <span className="font-heading text-[13px] font-semibold text-success">
                        +{region.growthPercent}%
                      </span>
                    </div>
                    <span className="font-heading text-[28px] font-bold text-text-primary">
                      {formatNumber(region.totalTeu)} TEU
                    </span>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-border-light relative">
                      <div
                        className="h-1.5 absolute left-0 top-0"
                        style={{ width: `${barWidth}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs text-text-muted">Mặt hàng cần tìm khách</span>
                        <span className="font-heading text-xs font-semibold text-text-primary">
                          {region.topCommodity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs text-text-muted">Kho bãi sẵn có</span>
                        <span className="font-heading text-xs font-semibold text-text-primary">
                          {region.warehouseCount} kho ({region.coldStorageCount} lạnh)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Regional Detail Table */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Cơ hội theo Vùng — Mặt hàng nào, kho nào, container nào?
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-2.5 font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">VÙNG MIỀN</th>
                      <th className="text-left py-2.5 w-[180px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">MẶT HÀNG CẦN TÌM KHÁCH</th>
                      <th className="text-left py-2.5 w-[120px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">LOẠI KHO CẦN</th>
                      <th className="text-left py-2.5 w-[140px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">CONTAINER PHÙ HỢP</th>
                      <th className="text-right py-2.5 w-[110px] font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">NHU CẦU (TEU)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regionDemands.map((region) => (
                      <tr
                        key={region.regionCode}
                        className="border-b border-border-light last:border-b-0 hover:bg-page transition-colors"
                      >
                        <td className="py-3 font-heading text-[13px] font-semibold text-text-primary">
                          {region.regionName}
                        </td>
                        <td className="py-3 font-body text-[13px] text-text-primary">
                          {REGION_COMMODITIES[region.regionCode] ?? region.topCommodity}
                        </td>
                        <td className={cn(
                          'py-3 font-body text-[13px]',
                          REGION_WAREHOUSES[region.regionCode] === 'Kho lạnh'
                            ? 'text-accent font-semibold'
                            : 'text-text-muted',
                        )}>
                          {REGION_WAREHOUSES[region.regionCode] ?? 'Kho thường'}
                        </td>
                        <td className="py-3 font-body text-[13px] text-text-muted">
                          {REGION_CONTAINERS[region.regionCode] ?? 'Dry 40HC'}
                        </td>
                        <td className="py-3 text-right font-heading text-[13px] font-semibold text-text-primary">
                          {formatNumber(region.totalTeu)}
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
