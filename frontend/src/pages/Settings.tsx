import { useState } from 'react';
import { Save } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border-light last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <span className="font-heading text-[13px] font-semibold text-text-primary">{label}</span>
        <span className="font-body text-[12px] text-text-muted">{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 transition-colors ${checked ? 'bg-accent' : 'bg-border-light'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white transition-transform ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@logistics.vn',
    role: 'Sales Consultant',
    department: 'Phòng Kinh doanh',
  });

  const [notifications, setNotifications] = useState({
    forecastAlert: true,
    weeklyReport: true,
    newCustomerAlert: false,
    containerAvailability: true,
  });

  const [dataSources, setDataSources] = useState({
    autoSync: true,
    syncInterval: '6',
    apiEndpoint: 'https://api.demand-intel.vn/v1',
  });

  return (
    <>
      <TopBar title="Cài đặt" />
      <main className="flex-1 p-8 overflow-y-auto space-y-7">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-[28px] font-bold text-text-primary">
              Cài đặt hệ thống
            </h1>
            <p className="font-body text-sm text-text-secondary">
              Quản lý thông tin cá nhân, thông báo và nguồn dữ liệu
            </p>
          </div>
          <button className="flex items-center gap-2 h-9 px-4 bg-accent font-heading text-[11px] font-semibold text-text-on-dark tracking-[1px]">
            <Save size={14} />
            LƯU THAY ĐỔI
          </button>
        </div>

        <div className="flex gap-5">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Profile */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">HỌ VÀ TÊN</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="h-10 px-3 bg-page font-body text-[13px] text-text-primary outline-none border border-border-light focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">EMAIL</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="h-10 px-3 bg-page font-body text-[13px] text-text-primary outline-none border border-border-light focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">VAI TRÒ</label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile(p => ({ ...p, role: e.target.value }))}
                    className="h-10 px-3 bg-page font-body text-[13px] text-text-primary outline-none border border-border-light focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">PHÒNG BAN</label>
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}
                    className="h-10 px-3 bg-page font-body text-[13px] text-text-primary outline-none border border-border-light focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-card p-6 flex flex-col gap-5">
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Nguồn dữ liệu
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">API ENDPOINT</label>
                  <input
                    type="text"
                    value={dataSources.apiEndpoint}
                    onChange={(e) => setDataSources(d => ({ ...d, apiEndpoint: e.target.value }))}
                    className="h-10 px-3 bg-page font-body text-[13px] text-text-primary outline-none border border-border-light focus:border-accent transition-colors font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold text-text-secondary tracking-[1px]">CHU KỲ ĐỒNG BỘ (GIỜ)</label>
                  <input
                    type="number"
                    value={dataSources.syncInterval}
                    onChange={(e) => setDataSources(d => ({ ...d, syncInterval: e.target.value }))}
                    className="h-10 px-3 bg-page font-body text-[13px] text-text-primary outline-none border border-border-light focus:border-accent transition-colors w-[120px]"
                  />
                </div>
                <Toggle
                  label="Tự động đồng bộ"
                  description="Đồng bộ dữ liệu tự động theo chu kỳ"
                  checked={dataSources.autoSync}
                  onChange={(v) => setDataSources(d => ({ ...d, autoSync: v }))}
                />
              </div>
            </div>
          </div>

          {/* Right column — Notifications */}
          <div className="w-[400px]">
            <div className="bg-card p-6 flex flex-col gap-5">
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Thông báo
              </h3>
              <div className="flex flex-col">
                <Toggle
                  label="Cảnh báo dự báo"
                  description="Nhận thông báo khi dự báo có thay đổi lớn"
                  checked={notifications.forecastAlert}
                  onChange={(v) => setNotifications(n => ({ ...n, forecastAlert: v }))}
                />
                <Toggle
                  label="Báo cáo tuần"
                  description="Nhận email tổng hợp hàng tuần"
                  checked={notifications.weeklyReport}
                  onChange={(v) => setNotifications(n => ({ ...n, weeklyReport: v }))}
                />
                <Toggle
                  label="Khách hàng mới"
                  description="Thông báo khi có cơ hội khách hàng mới"
                  checked={notifications.newCustomerAlert}
                  onChange={(v) => setNotifications(n => ({ ...n, newCustomerAlert: v }))}
                />
                <Toggle
                  label="Container khả dụng"
                  description="Cảnh báo khi container phù hợp có sẵn"
                  checked={notifications.containerAvailability}
                  onChange={(v) => setNotifications(n => ({ ...n, containerAvailability: v }))}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
