// src/contexts/FinancialContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import financialService from '../components/services/financialAnalysis/financialService';
import kpiService from '../components/services/financialAnalysis/kpiService';

// Crear el contexto
const FinancialContext = createContext();

// Estado inicial
const initialState = {
  dateRange: {
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Enero 1 del año actual
    endDate: new Date().toISOString().split('T')[0], // Fecha actual
  },
  kpis: {},
  billingData: [],
  collectionData: [],
  projectionData: [],
  accountsReceivable: [],
  profitabilityData: [],
  filters: {
    entityId: null,
    serviceTypeId: null,
    contractId: null,
  },
  loading: {
    kpis: false,
    billingData: false,
    collectionData: false,
    projectionData: false,
    accountsReceivable: false,
    profitabilityData: false,
  },
  error: null,
  lastUpdated: null,
};

// Tipos de acciones
const actionTypes = {
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  SET_FILTERS: 'SET_FILTERS',
  SET_KPIS: 'SET_KPIS',
  SET_BILLING_DATA: 'SET_BILLING_DATA',
  SET_COLLECTION_DATA: 'SET_COLLECTION_DATA',
  SET_PROJECTION_DATA: 'SET_PROJECTION_DATA',
  SET_ACCOUNTS_RECEIVABLE: 'SET_ACCOUNTS_RECEIVABLE',
  SET_PROFITABILITY_DATA: 'SET_PROFITABILITY_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
};

// Reducer para manejar estado
const financialReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_DATE_RANGE:
      return {
        ...state,
        dateRange: action.payload,
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_KPIS:
      return {
        ...state,
        kpis: {
          ...state.kpis,
          ...action.payload,
        },
        loading: {
          ...state.loading,
          kpis: false,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_BILLING_DATA:
      return {
        ...state,
        billingData: action.payload,
        loading: {
          ...state.loading,
          billingData: false,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_COLLECTION_DATA:
      return {
        ...state,
        collectionData: action.payload,
        loading: {
          ...state.loading,
          collectionData: false,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_PROJECTION_DATA:
      return {
        ...state,
        projectionData: action.payload,
        loading: {
          ...state.loading,
          projectionData: false,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_ACCOUNTS_RECEIVABLE:
      return {
        ...state,
        accountsReceivable: action.payload,
        loading: {
          ...state.loading,
          accountsReceivable: false,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_PROFITABILITY_DATA:
      return {
        ...state,
        profitabilityData: action.payload,
        loading: {
          ...state.loading,
          profitabilityData: false,
        },
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload,
        },
      };
    
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        lastUpdated: new Date().toISOString(),
      };
    
    case actionTypes.RESET_STATE:
      return {
        ...initialState,
        filters: state.filters, // Mantener filtros actuales
      };
    
    default:
      return state;
  }
};

// Proveedor del contexto
export const FinancialProvider = ({ children }) => {
  const [state, dispatch] = useReducer(financialReducer, initialState);
  
  // Cargar datos financieros
  const loadFinancialData = async () => {
    try {
      // Marcar inicio de carga
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: {
          kpis: true,
          billingData: true,
          collectionData: true,
        },
      });
      
      dispatch({ type: actionTypes.SET_ERROR, payload: null });
      
      // Parámetros comunes para todas las consultas
      const params = {
        startDate: state.dateRange.startDate,
        endDate: state.dateRange.endDate,
        ...state.filters,
      };
      
      // Cargar KPIs financieros
      const kpisResponse = await financialService.getFinancialKPIs(params);
      dispatch({
        type: actionTypes.SET_KPIS,
        payload: kpisResponse.data,
      });
      
      // Cargar datos de facturación
      const billingResponse = await financialService.getBillingTrends(params);
      dispatch({
        type: actionTypes.SET_BILLING_DATA,
        payload: billingResponse.data,
      });
      
      // Cargar datos de recaudos
      const collectionResponse = await financialService.getCollectionTrends(params);
      dispatch({
        type: actionTypes.SET_COLLECTION_DATA,
        payload: collectionResponse.data,
      });
      
    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar datos financieros. Por favor intente nuevamente.',
      });
      
      // Marcar fin de carga con error
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: {
          kpis: false,
          billingData: false,
          collectionData: false,
        },
      });
    }
  };
  
  // Cargar proyecciones financieras
  const loadProjections = async (projectionParams = {}) => {
    try {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { projectionData: true },
      });
      
      // Parámetros para proyección
      const params = {
        startDate: state.dateRange.startDate,
        endDate: state.dateRange.endDate,
        ...state.filters,
        ...projectionParams,
      };
      
      const response = await financialService.getFinancialProjections(params);
      
      dispatch({
        type: actionTypes.SET_PROJECTION_DATA,
        payload: response.data,
      });
      
    } catch (error) {
      console.error('Error al cargar proyecciones:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar proyecciones financieras.',
      });
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { projectionData: false },
      });
    }
  };
  
  // Cargar análisis de cartera por edades
  const loadAccountsReceivable = async () => {
    try {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { accountsReceivable: true },
      });
      
      const params = {
        cutoffDate: state.dateRange.endDate, // Fecha de corte
        ...state.filters,
      };
      
      const response = await financialService.getAccountsReceivableAging(params);
      
      dispatch({
        type: actionTypes.SET_ACCOUNTS_RECEIVABLE,
        payload: response.data,
      });
      
    } catch (error) {
      console.error('Error al cargar análisis de cartera:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar análisis de cartera.',
      });
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { accountsReceivable: false },
      });
    }
  };
  
  // Cargar análisis de rentabilidad
  const loadProfitabilityData = async () => {
    try {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { profitabilityData: true },
      });
      
      const params = {
        startDate: state.dateRange.startDate,
        endDate: state.dateRange.endDate,
        ...state.filters,
      };
      
      const response = await financialService.getProfitabilityAnalysis(params);
      
      dispatch({
        type: actionTypes.SET_PROFITABILITY_DATA,
        payload: response.data,
      });
      
    } catch (error) {
      console.error('Error al cargar análisis de rentabilidad:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar análisis de rentabilidad.',
      });
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { profitabilityData: false },
      });
    }
  };
  
  // Actualizar rango de fechas
  const setDateRange = (startDate, endDate) => {
    dispatch({
      type: actionTypes.SET_DATE_RANGE,
      payload: { startDate, endDate },
    });
  };
  
  // Actualizar filtros
  const setFilters = (filters) => {
    dispatch({
      type: actionTypes.SET_FILTERS,
      payload: filters,
    });
  };
  
  // Resetear estado
  const resetState = () => {
    dispatch({ type: actionTypes.RESET_STATE });
  };
  
  // Exportar informe financiero
  const exportFinancialReport = async (reportType, format = 'PDF') => {
    try {
      const params = {
        startDate: state.dateRange.startDate,
        endDate: state.dateRange.endDate,
        ...state.filters,
      };
      
      return await financialService.exportFinancialReport(reportType, params, format);
    } catch (error) {
      console.error('Error al exportar informe:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al exportar informe financiero.',
      });
      throw error;
    }
  };
  
  // Cargar datos cuando cambian fechas o filtros
  useEffect(() => {
    loadFinancialData();
    // No cargamos todo automáticamente para evitar sobrecarga
    // loadProjections(), loadAccountsReceivable() y loadProfitabilityData()
    // se cargarán bajo demanda
  }, [state.dateRange, state.filters]);
  
  // Valor a exponer en el contexto
  const value = {
    ...state,
    setDateRange,
    setFilters,
    loadFinancialData,
    loadProjections,
    loadAccountsReceivable,
    loadProfitabilityData,
    exportFinancialReport,
    resetState,
  };
  
  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial debe ser usado dentro de un FinancialProvider');
  }
  return context;
};

export default FinancialContext;