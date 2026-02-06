import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import DashboardContent from './DashboardContent';
import MAPage from './pages/MAPage';
import RedevelopmentPage from './pages/RedevelopmentPage';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ApprovalSuccess from './components/ApprovalSuccess';
import AdminApproval from './components/AdminApproval';
import './index.css';

function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`app-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin/approve/:token" element={<ApprovalSuccess />} />

          {/* Admin Routes (require admin role) */}
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminApproval />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes with Sidebar Layout */}
          <Route
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DashboardLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardContent />} />
            <Route path="/m-and-a" element={<MAPage />} />
            <Route path="/redevelopment" element={<RedevelopmentPage />} />
          </Route>

          {/* Default Route */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Fallback Route */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
