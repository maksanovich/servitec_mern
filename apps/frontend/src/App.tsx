import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { TrackPage } from './pages/TrackPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="track" element={<TrackPage />} />
        </Route>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<AdminPlaceholder title="Profile" />} />
        <Route path="config" element={<AdminPlaceholder title="Configuration" />} />
        <Route path="activity" element={<AdminPlaceholder title="Activity" />} />
        <Route path="repair-shop" element={<OrdersPage />} />
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
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
