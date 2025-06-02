import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/auth/AuthContext';
import Layout from './core/layout/Layout';
import LoadingScreen from './shared/components/LoadingScreen';

// Lazy loaded components
const Login = lazy(() => import('./core/auth/Login'));
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const InventoryList = lazy(() => import('./modules/inventory/InventoryList'));
const InventoryDetail = lazy(() => import('./modules/inventory/InventoryDetail'));
const WarehouseList = lazy(() => import('./modules/warehouse/WarehouseList'));
const WarehouseDetail = lazy(() => import('./modules/warehouse/WarehouseDetail'));
const RequestsList = lazy(() => import('./modules/requests/RequestsList'));
const RequestDetail = lazy(() => import('./modules/requests/RequestDetail'));
const CreateRequest = lazy(() => import('./modules/requests/CreateRequest'));
const ServiceIncidents = lazy(() => import('./modules/service/ServiceIncidents'));
const ServiceMaintenance = lazy(() => import('./modules/service/ServiceMaintenance'));
const KnowledgeBase = lazy(() => import('./modules/service/KnowledgeBase'));
const AnalyticsDashboard = lazy(() => import('./modules/analytics/AnalyticsDashboard'));
const Reports = lazy(() => import('./modules/analytics/Reports'));
const Settings = lazy(() => import('./modules/settings/Settings'));
const NotFound = lazy(() => import('./shared/components/NotFound'));

function App() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Inventory Routes */}
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/inventory/:id" element={<InventoryDetail />} />
          
          {/* Warehouse Routes */}
          <Route path="/warehouse" element={<WarehouseList />} />
          <Route path="/warehouse/:id" element={<WarehouseDetail />} />
          
          {/* Requests Routes */}
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/requests/new" element={<CreateRequest />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          
          {/* Service Management Routes */}
          <Route path="/service/incidents" element={<ServiceIncidents />} />
          <Route path="/service/maintenance" element={<ServiceMaintenance />} />
          <Route path="/service/knowledge" element={<KnowledgeBase />} />
          
          {/* Analytics Routes */}
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/analytics/reports" element={<Reports />} />
          
          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
