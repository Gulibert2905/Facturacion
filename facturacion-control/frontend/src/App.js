import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Reports from './pages/Reports';
import ImportData from './pages/ImportData';
import AuditDashboard from './pages/AuditDashboard';
import FinancialDashboard from './pages/FinancialDashboard';
import RipsGenerator from './components/services/rips/RipsGenerator';
import CupsManagement from './pages/CupsManagement';
import ContractTariffs from './pages/ContractTariffs';
import CompanyManagement from './pages/CompanyManagement';
import ContractManagement from './pages/ContractManagement';
import AppProviders from './components/AppProviders';
import AdvancedDashboard from './pages/AdvancedDashboard';
import AdvancedReports from './pages/AdvancedReports';
import UserManagement from './pages/UserManagement';
import RolePermissions from './pages/RolePermissions';
import SuperAdminPanel from './pages/SuperAdminPanel';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

// Componente para capturar errores
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error en componente:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', backgroundColor: '#ffeeee', margin: 20, borderRadius: 5 }}>
          <h3>Error al cargar el componente</h3>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <p>Revisa la consola para más detalles.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  console.log("Renderizando App component");
  
  return (
    <AppProviders>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute>
            <Layout>
              <Services />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/advanced-reports" element={
          <ProtectedRoute>
            <Layout>
              <AdvancedReports />
            </Layout>
          </ProtectedRoute>
        } />
        {/* Utilizar ErrorBoundary en los nuevos componentes */}
        <Route path="/companies" element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <CompanyManagement />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/contracts" element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <ContractManagement />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cups" element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <CupsManagement />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tariffs" element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <ContractTariffs />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/advanced-dashboard" element={
          <ProtectedRoute>
            <Layout>
              <AdvancedDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/import" element={
          <ProtectedRoute>
            <Layout>
              <ImportData />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute>
            <Layout>
              <AuditDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/financial" element={
          <ProtectedRoute>
            <Layout>
              <FinancialDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/rips" element={
          <ProtectedRoute>
            <Layout>
              <RipsGenerator />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute requiredRole="superadmin">
            <Layout>
              <ErrorBoundary>
                <UserManagement />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/role-permissions" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <ErrorBoundary>
                <RolePermissions />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/super-admin" element={
          <ProtectedRoute requiredRole="superadmin">
            <Layout>
              <ErrorBoundary>
                <SuperAdminPanel />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AppProviders>
  );
}

export default App;