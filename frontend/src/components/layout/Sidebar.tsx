import { NavLink } from 'react-router-dom';
import { LayoutGrid, Users, Box, FileText, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'ANALYTICS', items: [
    { to: '/', icon: LayoutGrid, label: 'DASHBOARD' },
    { to: '/customers', icon: Users, label: 'CUSTOMERS' },
    { to: '/containers', icon: Box, label: 'CONTAINERS' },
  ]},
  { label: 'MANAGEMENT', items: [
    { to: '/reports', icon: FileText, label: 'REPORTS' },
    { to: '/settings', icon: Settings, label: 'SETTINGS' },
  ]},
];

export function Sidebar() {
  return (
    <aside className="w-[260px] min-w-[260px] h-full bg-sidebar flex flex-col py-8 px-6 gap-8 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-accent" />
        <span className="font-heading text-[15px] font-bold text-text-on-dark tracking-[2px]">
          DEMAND INTEL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-8">
        {navItems.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <span className="font-heading text-[11px] font-semibold text-text-muted tracking-[1px] pb-2">
              {section.label}
            </span>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 h-10 px-3 font-heading text-xs tracking-[1px] transition-colors',
                  isActive
                    ? 'bg-dark-surface text-accent font-semibold'
                    : 'text-text-tertiary font-medium hover:text-text-on-dark'
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={isActive ? 'text-accent' : 'text-text-tertiary'} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
