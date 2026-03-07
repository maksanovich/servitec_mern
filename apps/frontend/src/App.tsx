import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { TrackPage } from './pages/TrackPage';

import { LoginPage } from './pages/admin/LoginPage';

import { DashboardPage } from './pages/admin/DashboardPage';

import { OrdersPage } from './pages/admin/OrdersPage';
import { NewOrderPage } from './pages/admin/NewOrderPage';

import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';
import { ProfilePage } from './pages/admin/ProfilePage';

import { CompanyPage } from './pages/admin/CompanyPage';
import { BranchPage } from './pages/admin/BranchPage';
import { RolePage } from './pages/admin/RolePage';
import { UserPage } from './pages/admin/UserPage';

import { CustomersPage } from './pages/admin/CustomersPage';
import { BrandsPage } from './pages/admin/BrandsPage';
import { ModelsPage } from './pages/admin/ModelsPage';
import { AccessoriesPage } from './pages/admin/AccessoriesPage';
import { ProductsPage } from './pages/admin/ProductsPage';

import { ServicesSparePartsPage } from './pages/admin/ServicesSparePartsPage';
import { IncomePage } from './pages/admin/IncomePage';
import { NotFoundPage } from './pages/NotFoundPage';

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
                <CompanyProvider>
                  <AdminLayout />
                </CompanyProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="config" element={<AdminPlaceholder title="Configuration" />} />
            <Route path="activity" element={<AdminPlaceholder title="Activity" />} />
            <Route path="order" element={<OrdersPage />} />
            <Route path="order/new" element={<NewOrderPage />} />
            <Route path="clients" element={<CustomersPage />} />
            <Route path="brand" element={<BrandsPage />} />
            <Route path="brand/new" element={<AdminPlaceholder title="New Brand" />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="model/new" element={<AdminPlaceholder title="New Model" />} />
            <Route path="accessories" element={<AccessoriesPage />} />
            <Route path="accessories/new" element={<AdminPlaceholder title="New Accessory" />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<AdminPlaceholder title="New Product" />} />
            <Route path="services" element={<ServicesSparePartsPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="company" element={<CompanyPage />} />
            <Route path="branch" element={<BranchPage />} />
            <Route path="branch/new" element={<AdminPlaceholder title="New Branch" />} />
            <Route path="users" element={<UserPage />} />
            <Route path="roles" element={<RolePage />} />
            <Route path="docs" element={<AdminPlaceholder title="Documentation" />} />
          </Route>
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/workshop-config" element={<Navigate to="/admin/clients" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
