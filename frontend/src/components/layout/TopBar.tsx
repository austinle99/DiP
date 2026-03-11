import { Search, Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-14 min-h-[56px] border-b border-border-light flex items-center justify-between px-8">
      <h2 className="font-heading text-lg font-bold text-text-primary">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-card h-9 px-3 w-[220px]">
          <Search size={16} className="text-text-muted" />
          <span className="text-[13px] text-text-muted font-body">Search...</span>
        </div>
        <div className="flex items-center justify-center w-9 h-9 bg-card">
          <Bell size={18} className="text-text-secondary" />
        </div>
        <div className="w-8 h-8 bg-accent" />
      </div>
    </header>
  );
}
