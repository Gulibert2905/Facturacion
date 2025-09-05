// src/components/AppProviders.jsx - Actualización para incluir NotificationProvider
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { esES } from '@mui/material/locale';
import { es } from 'date-fns/locale';

// Providers personalizados
import { LoadingProvider } from '../contexts/LoadingContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AuthProvider } from '../contexts/AuthContext';
// Import new context providers
import { AuditProvider } from '../contexts/AuditContext';
import { FinancialProvider } from '../contexts/FinancialContext';
import { RipsProvider } from '../contexts/RipsContext';
import GlobalLoadingOverlay from './GlobalLoadingOverlay';

// Cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      lighter: '#e3f2fd',
    },
    secondary: {
      main: '#9c27b0',
      lighter: '#f3e5f5',
    },
    success: {
      main: '#2e7d32',
      lighter: '#e8f5e9',
    },
    error: {
      main: '#d32f2f',
      lighter: '#ffebee',
    },
    warning: {
      main: '#ed6c02',
      lighter: '#fff3e0',
    },
    info: {
      main: '#0288d1',
      lighter: '#e1f5fe',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
}, esES);

/**
 * Componente que proporciona todos los providers necesarios para la aplicación
 */
const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <NotificationProvider>
            <LoadingProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                  {/* Add the new context providers */}
                  <AuditProvider>
                    <FinancialProvider>
                      <RipsProvider>
                        <GlobalLoadingOverlay />
                        {children}
                      </RipsProvider>
                    </FinancialProvider>
                  </AuditProvider>
                </AuthProvider>
              </BrowserRouter>
            </LoadingProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;