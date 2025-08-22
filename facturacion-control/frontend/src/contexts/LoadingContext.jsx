// src/contexts/LoadingContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';

// Crear contexto
const LoadingContext = createContext();

/**
 * Proveedor para el contexto de carga
 */
export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: '',
    progress: 0,
    processId: null
  });

  // Iniciar un proceso de carga (compatible con la versión anterior)
  const showLoading = useCallback((message = 'Cargando...', processId = null) => {
    setLoadingState({
      isLoading: true,
      message,
      progress: 0,
      processId
    });
  }, []);

  // Para compatibilidad con la implementación anterior
  const startLoading = showLoading;

  // Actualizar el progreso de un proceso de carga
  const updateProgress = useCallback((progress, message = null) => {
    setLoadingState(prevState => ({
      ...prevState,
      progress,
      message: message || prevState.message
    }));
  }, []);

  // Finalizar un proceso de carga (compatible con la versión anterior)
  const hideLoading = useCallback((processId = null) => {
    // Si se proporciona un processId, solo detener si coincide
    if (processId && processId !== loadingState.processId) {
      return;
    }
    
    setLoadingState({
      isLoading: false,
      message: '',
      progress: 0,
      processId: null
    });
  }, [loadingState.processId]);

  // Para compatibilidad con la implementación anterior
  const stopLoading = hideLoading;

  // Actualizar mensaje
  const updateMessage = useCallback((message) => {
    setLoadingState(prevState => ({
      ...prevState,
      message
    }));
  }, []);

  const value = {
    // Propiedades de estado para GlobalLoadingOverlay
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    progress: loadingState.progress,
    processId: loadingState.processId,
    
    // Métodos antiguos
    startLoading,
    updateProgress,
    stopLoading,
    
    // Métodos nuevos para compatibilidad
    showLoading,
    hideLoading,
    updateMessage
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading debe ser usado dentro de un LoadingProvider');
  }
  return context;
};