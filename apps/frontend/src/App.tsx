import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequirePage } from './components/RequirePage';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { TrackPage } from './pages/TrackPage';
import { PreDiagnosisPage } from './pages/PreDiagnosisPage';

import { LoginPage } from './pages/admin/LoginPage';

import { DashboardPage } from './pages/admin/DashboardPage';

import { OrdersPage } from './pages/admin/OrdersPage';
import { NewOrderPage } from './pages/admin/NewOrderPage';
import { OrderStagesPage } from './pages/admin/OrderStagesPage';
import { OrderPrintPage } from './pages/admin/OrderPrintPage';

import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';
import { ProfilePage } from './pages/admin/ProfilePage';

import { CompanyPage } from './pages/admin/CompanyPage';
import { RolePage } from './pages/admin/RolePage';
import { UserPage } from './pages/admin/UserPage';

import { CustomersPage } from './pages/admin/CustomersPage';
import { BrandsPage } from './pages/admin/BrandsPage';
import { ModelsPage } from './pages/admin/ModelsPage';
import { AccessoriesPage } from './pages/admin/AccessoriesPage';
import { ProductsPage } from './pages/admin/ProductsPage';

import { ServicesSparePartsPage } from './pages/admin/ServicesSparePartsPage';
import { IncomePage } from './pages/admin/IncomePage';
import { PreDiagnosisRulesPage } from './pages/admin/PreDiagnosisRulesPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:code" element={<BlogPostPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="diagnosis" element={<PreDiagnosisPage />} />
          </Route>
          <Route
            path="/admin/order/:id/print"
            element={
              <ProtectedRoute>
                <RequirePage page="/admin/order">
                  <OrderPrintPage />
                </RequirePage>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <CompanyProvider>
                  <NotificationProvider>
                    <AdminLayout />
                  </NotificationProvider>
                </CompanyProvider>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <RequirePage page="/admin">
                  <DashboardPage />
                </RequirePage>
              }
            />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="config"
              element={
                <RequirePage page="/admin">
                  <AdminPlaceholder title="Configuration" />
                </RequirePage>
              }
            />
            <Route
              path="activity"
              element={
                <RequirePage page="/admin">
                  <AdminPlaceholder title="Activity" />
                </RequirePage>
              }
            />
            <Route
              path="order"
              element={
                <RequirePage page="/admin/order">
                  <OrdersPage />
                </RequirePage>
              }
            />
            <Route
              path="order/stages"
              element={
                <RequirePage page="/admin/order">
                  <OrderStagesPage />
                </RequirePage>
              }
            />
            <Route
              path="order/new"
              element={
                <RequirePage page="/admin/order">
                  <NewOrderPage />
                </RequirePage>
              }
            />
            <Route
              path="order/:id/edit"
              element={
                <RequirePage page="/admin/order">
                  <NewOrderPage />
                </RequirePage>
              }
            />
            <Route
              path="clients"
              element={
                <RequirePage page="/admin/clients">
                  <CustomersPage />
                </RequirePage>
              }
            />
            <Route
              path="brand"
              element={
                <RequirePage page="/admin/brand">
                  <BrandsPage />
                </RequirePage>
              }
            />
            <Route
              path="brand/new"
              element={
                <RequirePage page="/admin/brand">
                  <AdminPlaceholder title="New Brand" />
                </RequirePage>
              }
            />
            <Route
              path="models"
              element={
                <RequirePage page="/admin/models">
                  <ModelsPage />
                </RequirePage>
              }
            />
            <Route
              path="model/new"
              element={
                <RequirePage page="/admin/models">
                  <AdminPlaceholder title="New Model" />
                </RequirePage>
              }
            />
            <Route
              path="accessories"
              element={
                <RequirePage page="/admin/accessories">
                  <AccessoriesPage />
                </RequirePage>
              }
            />
            <Route
              path="accessories/new"
              element={
                <RequirePage page="/admin/accessories">
                  <AdminPlaceholder title="New Accessory" />
                </RequirePage>
              }
            />
            <Route
              path="products"
              element={
                <RequirePage page="/admin/products">
                  <ProductsPage />
                </RequirePage>
              }
            />
            <Route
              path="services"
              element={
                <RequirePage page="/admin/services">
                  <ServicesSparePartsPage />
                </RequirePage>
              }
            />
            <Route
              path="income"
              element={
                <RequirePage page="/admin/income">
                  <IncomePage />
                </RequirePage>
              }
            />
            <Route
              path="pre-diagnosis"
              element={
                <RequirePage page="/admin/pre-diagnosis">
                  <PreDiagnosisRulesPage />
                </RequirePage>
              }
            />
            <Route
              path="company"
              element={
                <RequirePage page="/admin/company">
                  <CompanyPage />
                </RequirePage>
              }
            />
            <Route
              path="users"
              element={
                <RequirePage page="/admin/users">
                  <UserPage />
                </RequirePage>
              }
            />
            <Route
              path="roles"
              element={
                <RequirePage page="/admin/roles">
                  <RolePage />
                </RequirePage>
              }
            />
            <Route
              path="docs"
              element={
                <RequirePage page="/admin/docs">
                  <AdminPlaceholder title="Documentation" />
                </RequirePage>
              }
            />
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
