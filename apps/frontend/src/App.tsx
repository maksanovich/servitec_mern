import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { TrackPage } from './pages/TrackPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="track" element={<TrackPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="repair-shop" element={<AdminPlaceholder title="Repair Shop" />} />
        <Route path="workshop-config" element={<AdminPlaceholder title="Workshop Configurations" />} />
        <Route path="services" element={<AdminPlaceholder title="Services / Spare Parts" />} />
        <Route path="income" element={<AdminPlaceholder title="Monetary Income" />} />
        <Route path="company" element={<AdminPlaceholder title="Company" />} />
        <Route path="branch" element={<AdminPlaceholder title="Branch" />} />
        <Route path="users" element={<AdminPlaceholder title="Users" />} />
        <Route path="roles" element={<AdminPlaceholder title="Roles" />} />
        <Route path="docs" element={<AdminPlaceholder title="Documentation" />} />
      </Route>
      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
