// src/contexts/AuditContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import auditService from '../components/services/audit/auditService';
import ruleService from '../components/services/audit/ruleService';

// Crear el contexto
const AuditContext = createContext();

// Estado inicial
const initialState = {
  // Parámetros de auditoría
  params: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0], // Primer día del mes anterior
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0], // Último día del mes anterior
    entityIds: [],
    contractIds: [],
    ruleIds: []
  },
  // Resultados de auditoría
  results: [],
  // Detalles de un resultado específico
  currentResult: null,
  // Reglas disponibles
  rules: [],
  // Reglas seleccionadas
  selectedRules: [],
  // Estadísticas de auditoría
  stats: null,
  // Estado de carga
  loading: {
    rules: false,
    results: false,
    currentResult: false,
    stats: false,
    audit: false
  },
  // Estado de error
  error: null,
  // Última actualización
  lastUpdated: null
};

// Tipos de acciones
const actionTypes = {
  SET_PARAMS: 'SET_PARAMS',
  SET_RESULTS: 'SET_RESULTS',
  SET_CURRENT_RESULT: 'SET_CURRENT_RESULT',
  SET_RULES: 'SET_RULES',
  SET_SELECTED_RULES: 'SET_SELECTED_RULES',
  SET_STATS: 'SET_STATS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE'
};

// Reducer para manejar acciones
const auditReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_PARAMS:
      return {
        ...state,
        params: {
          ...state.params,
          ...action.payload
        },
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.SET_RESULTS:
      return {
        ...state,
        results: action.payload,
        loading: {
          ...state.loading,
          results: false
        },
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.SET_CURRENT_RESULT:
      return {
        ...state,
        currentResult: action.payload,
        loading: {
          ...state.loading,
          currentResult: false
        },
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.SET_RULES:
      return {
        ...state,
        rules: action.payload,
        loading: {
          ...state.loading,
          rules: false
        },
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.SET_SELECTED_RULES:
      return {
        ...state,
        selectedRules: action.payload,
        params: {
          ...state.params,
          ruleIds: action.payload.map(rule => rule.id)
        },
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.SET_STATS:
      return {
        ...state,
        stats: action.payload,
        loading: {
          ...state.loading,
          stats: false
        },
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload
        }
      };
    
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case actionTypes.RESET_STATE:
      return {
        ...initialState,
        rules: state.rules // Mantener reglas cargadas
      };
    
    default:
      return state;
  }
};

// Proveedor del contexto
export const AuditProvider = ({ children }) => {
  const [state, dispatch] = useReducer(auditReducer, initialState);
  
  // Cargar reglas de auditoría al montar el componente
  useEffect(() => {
    loadRules();
  }, []);
  
  // Cargar reglas de auditoría
  const loadRules = async () => {
    try {
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { rules: true } 
      });
      
      const response = await ruleService.getAllRules();
      
      dispatch({
        type: actionTypes.SET_RULES,
        payload: response.data || []
      });
    } catch (error) {
      console.error('Error al cargar reglas de auditoría:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar reglas de auditoría'
      });
      
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { rules: false } 
      });
    }
  };
  
  // Cargar resultados de auditoría
  const loadResults = async (filters = {}) => {
    try {
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { results: true } 
      });
      
      const response = await auditService.getAuditResults(filters);
      
      dispatch({
        type: actionTypes.SET_RESULTS,
        payload: response.data || []
      });
    } catch (error) {
      console.error('Error al cargar resultados de auditoría:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar resultados de auditoría'
      });
      
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { results: false } 
      });
    }
  };
  
  // Cargar detalles de un resultado específico
  const loadResultDetails = async (resultId) => {
    try {
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { currentResult: true } 
      });
      
      const response = await auditService.getAuditResultDetails(resultId);
      
      dispatch({
        type: actionTypes.SET_CURRENT_RESULT,
        payload: response.data || null
      });
    } catch (error) {
      console.error('Error al cargar detalles de resultado:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar detalles de resultado'
      });
      
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { currentResult: false } 
      });
    }
  };
  
  // Cargar estadísticas de auditoría
  const loadStats = async () => {
    try {
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { stats: true } 
      });
      
      const response = await auditService.getAuditStats(state.params);
      
      dispatch({
        type: actionTypes.SET_STATS,
        payload: response.data || null
      });
    } catch (error) {
      console.error('Error al cargar estadísticas de auditoría:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al cargar estadísticas de auditoría'
      });
      
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { stats: false } 
      });
    }
  };
  
  // Ejecutar auditoría
  const runAudit = async () => {
    try {
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { audit: true } 
      });
      
      const response = await auditService.runAudit(state.params);
      
      // Actualizar resultados con la nueva auditoría
      await loadResults();
      
      // Actualizar estadísticas
      await loadStats();
      
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { audit: false } 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al ejecutar auditoría:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al ejecutar auditoría'
      });
      
      dispatch({ 
        type: actionTypes.SET_LOADING, 
        payload: { audit: false } 
      });
      
      throw error;
    }
  };
  
  // Actualizar parámetros de auditoría
  const setParams = (params) => {
    dispatch({
      type: actionTypes.SET_PARAMS,
      payload: params
    });
  };
  
  // Seleccionar reglas
  const selectRules = (rules) => {
    dispatch({
      type: actionTypes.SET_SELECTED_RULES,
      payload: rules
    });
  };
  
  // Exportar resultados
  const exportResults = async (resultId, format = 'PDF') => {
    try {
      return await auditService.exportAuditResults(resultId, format);
    } catch (error) {
      console.error('Error al exportar resultados:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: 'Error al exportar resultados de auditoría'
      });
      throw error;
    }
  };
  
  // Resetear estado
  const resetState = () => {
    dispatch({ type: actionTypes.RESET_STATE });
  };
  
  // Valor del contexto
  const value = {
    ...state,
    loadRules,
    loadResults,
    loadResultDetails,
    loadStats,
    runAudit,
    setParams,
    selectRules,
    exportResults,
    resetState
  };
  
  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit debe ser usado dentro de un AuditProvider');
  }
  return context;
};

export default AuditContext;