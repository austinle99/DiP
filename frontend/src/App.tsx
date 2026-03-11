import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardOverviewPage } from './pages/DashboardOverview';
import { CustomersPage } from './pages/Customers';
import { ContainersPage } from './pages/Containers';
import { ContainerRecommendationWorkspace } from './pages/ContainerRecommendation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardOverviewPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/logistics" element={<ContainerRecommendationWorkspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
