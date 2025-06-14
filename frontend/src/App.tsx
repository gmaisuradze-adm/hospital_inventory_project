import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { checkAuth } from './store/slices/authSlice';
import { initializeSocket } from './store/slices/notificationSlice';

// Layout Components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard';

// User Management
import UserList from './pages/Users/UserList';
import { UserProfile } from './pages/PlaceholderPages';

// Inventory Management
import InventoryList from './pages/Inventory/InventoryList';
import { InventoryDetails, AddInventoryItem, EditInventoryItem } from './pages/PlaceholderPages';

// IT Requests
import ITRequestList from './pages/ITRequests/ITRequestList';
import ITRequestDetails from './pages/ITRequests/ITRequestDetails';
import CreateITRequest from './pages/ITRequests/CreateITRequest';

// Procurement
import ProcurementList from './pages/Procurement/ProcurementList';
import ProcurementDetails from './pages/Procurement/ProcurementDetails';
import CreateProcurementRequest from './pages/Procurement/CreateProcurementRequest';

// Forms
import FormList from './pages/Forms/FormList';
import FormBuilder from './pages/Forms/FormBuilder';
import FormSubmissions from './pages/Forms/FormSubmissions';

// Reports
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import ReportGenerator from './pages/Reports/ReportGenerator';

// Settings
import Settings from './pages/Settings/Settings';

// Components
import LoadingScreen from './components/Common/LoadingScreen';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// AI Pages
import { AIOverview } from './pages';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(initializeSocket());
    }
  }, [isAuthenticated, dispatch]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route index element={<Navigate to="/auth/login" replace />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* User Management */}
          <Route path="users" element={<UserList />} />
          <Route path="profile" element={<UserProfile />} />

          {/* Inventory Management */}
          <Route path="inventory">
            <Route index element={<InventoryList />} />
            <Route path="add" element={<AddInventoryItem />} />
            <Route path=":id" element={<InventoryDetails />} />
            <Route path=":id/edit" element={<EditInventoryItem />} />
          </Route>

          {/* IT Requests */}
          <Route path="it-requests">
            <Route index element={<ITRequestList />} />
            <Route path="create" element={<CreateITRequest />} />
            <Route path=":id" element={<ITRequestDetails />} />
          </Route>

          {/* Procurement */}
          <Route path="procurement">
            <Route index element={<ProcurementList />} />
            <Route path="create" element={<CreateProcurementRequest />} />
            <Route path=":id" element={<ProcurementDetails />} />
          </Route>

          {/* Forms */}
          <Route path="forms">
            <Route index element={<FormList />} />
            <Route path="builder" element={<FormBuilder />} />
            <Route path=":id/submissions" element={<FormSubmissions />} />
          </Route>

          {/* Reports */}
          <Route path="reports">
            <Route index element={<ReportsDashboard />} />
            <Route path="generator" element={<ReportGenerator />} />
          </Route>

          {/* Settings */}
          <Route path="settings" element={<Settings />} />

          {/* AI Module */}
          <Route path="ai" element={<AIOverview />} />
        </Route>

        {/* Redirect to login if not authenticated */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
