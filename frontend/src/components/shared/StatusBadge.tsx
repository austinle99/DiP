import type { ShipmentStatus } from '../../lib/api/contract';
import { cn } from '../../lib/utils';

const statusConfig: Record<ShipmentStatus, { label: string; className: string }> = {
  IN_TRANSIT: { label: 'IN TRANSIT', className: 'bg-success' },
  PENDING: { label: 'PENDING', className: 'bg-accent' },
  DELIVERED: { label: 'DELIVERED', className: 'bg-info' },
  DELAYED: { label: 'DELAYED', className: 'bg-error' },
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      'inline-block px-2 py-0.5 font-heading text-[10px] font-semibold text-text-on-dark tracking-[1px]',
      config.className,
    )}>
      {config.label}
    </span>
  );
}
