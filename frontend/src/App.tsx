import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardOverviewPage } from './pages/DashboardOverview';
import { TrendForecastPage } from './pages/TrendForecast';
import { RegionBreakdownPage } from './pages/RegionBreakdown';
import { ContainerAnalysisPage } from './pages/ContainerAnalysis';
import { CustomersPage } from './pages/Customers';
import { SettingsPage } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardOverviewPage />} />
          <Route path="/trends" element={<TrendForecastPage />} />
          <Route path="/regions" element={<RegionBreakdownPage />} />
          <Route path="/containers" element={<ContainerAnalysisPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
