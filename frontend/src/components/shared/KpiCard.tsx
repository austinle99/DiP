import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;
  changeSuffix?: string;
}

export function KpiCard({ label, value, change, changeSuffix = '%' }: KpiCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div className="flex-1 bg-card p-6 flex flex-col gap-3">
      <span className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px] uppercase">
        {label}
      </span>
      <div className="flex items-end justify-between">
        <span className="font-heading text-[32px] font-bold text-text-primary leading-none">
          {value}
        </span>
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositive && <ArrowUpRight size={14} className="text-success" />}
            {isNegative && <ArrowDownRight size={14} className="text-success" />}
            {isNeutral && <Minus size={14} className="text-text-muted" />}
            <span className={cn(
              'font-heading text-[13px] font-semibold',
              isPositive && 'text-success',
              isNegative && (change > -5 ? 'text-success' : 'text-error'),
              isNeutral && 'text-text-muted',
            )}>
              {isPositive ? '+' : ''}{change}{changeSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
