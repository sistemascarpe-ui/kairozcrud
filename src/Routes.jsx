import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import InventoryManagement from './pages/inventory-management';
import LoginPage from './pages/login';
import CustomerManagement from './pages/customer-management';
import SalesManagement from './pages/sales-management';
import MetricsManagement from './pages/metrics-management';
import CashboxManagement from './pages/cashbox-management';
import BrandManagement from './pages/brand-management';
import EmpresaManagement from './pages/empresa-management';
import AdeudosManagement from './pages/adeudos-management';
import AdminFolios from './pages/admin-folios';
import CampaignManagement from './pages/campaign-management';
import CampaignForm from './pages/campaign-management/CampaignForm';
import Dashboard from './pages/Dashboard';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
        {/* Rutas públicas */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/inventory-management" element={
          <ProtectedRoute>
            <InventoryManagement />
          </ProtectedRoute>
        } />
        <Route path="/customer-management" element={
          <ProtectedRoute>
            <CustomerManagement />
          </ProtectedRoute>
        } />
        <Route path="/sales-management" element={
          <ProtectedRoute>
            <SalesManagement />
          </ProtectedRoute>
        } />
        <Route path="/metrics-management" element={
          <ProtectedRoute>
            <MetricsManagement />
          </ProtectedRoute>
        } />
        <Route path="/cashbox-management" element={
          <ProtectedRoute>
            <CashboxManagement />
          </ProtectedRoute>
        } />
        <Route path="/brand-management" element={
          <ProtectedRoute>
            <BrandManagement />
          </ProtectedRoute>
        } />
        <Route path="/empresa-management" element={
          <ProtectedRoute>
            <EmpresaManagement />
          </ProtectedRoute>
        } />
        <Route path="/adeudos-management" element={
          <ProtectedRoute>
            <AdeudosManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin-folios" element={
          <ProtectedRoute>
            <AdminFolios />
          </ProtectedRoute>
        } />
        <Route path="/campaign-management" element={
          <ProtectedRoute>
            <CampaignManagement />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/new" element={
          <ProtectedRoute>
            <CampaignForm />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/:id" element={
          <ProtectedRoute>
            <CampaignForm />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/:id/edit" element={
          <ProtectedRoute>
            <CampaignForm />
          </ProtectedRoute>
        } />
        
        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
