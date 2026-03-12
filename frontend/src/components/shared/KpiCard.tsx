import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;
  changeSuffix?: string;
  subtitle?: string;
  accentValue?: boolean;
}

export function KpiCard({ label, value, change, changeSuffix = '%', subtitle, accentValue }: KpiCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div className="flex-1 bg-card p-6 flex flex-col gap-3 min-h-[136px]">
      <span className={cn(
        'font-heading text-[11px] font-semibold tracking-[1px] uppercase',
        accentValue ? 'text-accent' : 'text-text-secondary',
      )}>
        {label}
      </span>
      <div className="flex flex-col gap-1">
        <span className={cn(
          'font-heading text-[32px] font-bold leading-none',
          accentValue ? 'text-accent' : 'text-text-primary',
        )}>
          {value}
        </span>
        {subtitle && (
          <span className="font-heading text-[13px] font-semibold text-text-muted">
            {subtitle}
          </span>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositive && <ArrowUpRight size={14} className="text-success" />}
            {isNegative && <ArrowDownRight size={14} className="text-error" />}
            {isNeutral && <Minus size={14} className="text-text-muted" />}
            <span className={cn(
              'font-heading text-[13px] font-semibold',
              isPositive && 'text-success',
              isNegative && 'text-error',
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
