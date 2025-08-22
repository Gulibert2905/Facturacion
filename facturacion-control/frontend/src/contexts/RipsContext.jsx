// src/contexts/RipsContext.jsx
import React, { createContext, useContext, useState, useReducer } from 'react';

// Crear el contexto
const RipsContext = createContext();

// Valores iniciales del estado
const initialState = {
  resolution: '3374', // Resolución por defecto
  config: {
    startDate: null,
    endDate: null,
    entityCode: '',
    entityName: '',
    includeFiles: []
  },
  validationResults: null,
  generatedRipsId: null,
  exportFormat: 'TXT',
  history: [],
  loading: false,
  error: null
};

// Tipos de acciones
const actionTypes = {
  SET_RESOLUTION: 'SET_RESOLUTION',
  UPDATE_CONFIG: 'UPDATE_CONFIG',
  SET_VALIDATION_RESULTS: 'SET_VALIDATION_RESULTS',
  SET_GENERATED_ID: 'SET_GENERATED_ID',
  SET_EXPORT_FORMAT: 'SET_EXPORT_FORMAT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY'
};

// Reducer para manejar acciones
const ripsReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_RESOLUTION:
      return {
        ...state,
        resolution: action.payload,
        // Reiniciar resultados al cambiar resolución
        validationResults: null,
        generatedRipsId: null
      };
    
    case actionTypes.UPDATE_CONFIG:
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload
        }
      };
    
    case actionTypes.SET_VALIDATION_RESULTS:
      return {
        ...state,
        validationResults: action.payload
      };
    
    case actionTypes.SET_GENERATED_ID:
      return {
        ...state,
        generatedRipsId: action.payload
      };
    
    case actionTypes.SET_EXPORT_FORMAT:
      return {
        ...state,
        exportFormat: action.payload
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    case actionTypes.RESET_STATE:
      return {
        ...initialState,
        resolution: state.resolution, // Mantener la resolución seleccionada
        history: state.history // Mantener el historial
      };
    
    case actionTypes.ADD_TO_HISTORY:
      return {
        ...state,
        history: [action.payload, ...state.history]
      };
    
    default:
      return state;
  }
};

// Proveedor del contexto
export const RipsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ripsReducer, initialState);
  
  // Métodos para interactuar con el estado
  const setResolution = (resolution) => {
    dispatch({ type: actionTypes.SET_RESOLUTION, payload: resolution });
  };
  
  const updateConfig = (configData) => {
    dispatch({ type: actionTypes.UPDATE_CONFIG, payload: configData });
  };
  
  const setValidationResults = (results) => {
    dispatch({ type: actionTypes.SET_VALIDATION_RESULTS, payload: results });
  };
  
  const setGeneratedRipsId = (id) => {
    dispatch({ type: actionTypes.SET_GENERATED_ID, payload: id });
  };
  
  const setExportFormat = (format) => {
    dispatch({ type: actionTypes.SET_EXPORT_FORMAT, payload: format });
  };
  
  const setLoading = (isLoading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: isLoading });
  };
  
  const setError = (errorMessage) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
  };
  
  const resetState = () => {
    dispatch({ type: actionTypes.RESET_STATE });
  };
  
  const addToHistory = (item) => {
    dispatch({ type: actionTypes.ADD_TO_HISTORY, payload: item });
  };
  
  // Valor a exponer en el contexto
  const value = {
    ...state,
    setResolution,
    updateConfig,
    setValidationResults,
    setGeneratedRipsId,
    setExportFormat,
    setLoading,
    setError,
    resetState,
    addToHistory
  };
  
  return (
    <RipsContext.Provider value={value}>
      {children}
    </RipsContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useRips = () => {
  const context = useContext(RipsContext);
  if (!context) {
    throw new Error('useRips debe ser usado dentro de un RipsProvider');
  }
  return context;
};

export default RipsContext;