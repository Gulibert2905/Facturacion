import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
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
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/services" element={
          <Layout>
            <Services />
          </Layout>
        } />
        <Route path="/reports" element={
          <Layout>
            <Reports />
          </Layout>
        } />
        
        {/* Utilizar ErrorBoundary en los nuevos componentes */}
        <Route path="/companies" element={
          <Layout>
            <ErrorBoundary>
              <CompanyManagement />
            </ErrorBoundary>
          </Layout>
        } />
        <Route path="/contracts" element={
          <Layout>
            <ErrorBoundary>
              <ContractManagement />
            </ErrorBoundary>
          </Layout>
        } />
        <Route path="/cups" element={
          <Layout>
            <ErrorBoundary>
              <CupsManagement />
            </ErrorBoundary>
          </Layout>
        } />
        <Route path="/tariffs" element={
          <Layout>
            <ErrorBoundary>
              <ContractTariffs />
            </ErrorBoundary>
          </Layout>
        } />
        
        <Route path="/import" element={
          <Layout>
            <ImportData />
          </Layout>
        } />
        <Route path="/audit" element={
          <Layout>
            <AuditDashboard />
          </Layout>
        } />
        <Route path="/financial" element={
          <Layout>
            <FinancialDashboard />
          </Layout>
        } />
        <Route path="/rips" element={
          <Layout>
            <RipsGenerator />
          </Layout>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AppProviders>
  );
}

export default App;