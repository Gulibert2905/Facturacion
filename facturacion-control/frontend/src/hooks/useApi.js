// src/hooks/useApi.js - Corrección para problema de credenciales
import { useState, useEffect, useCallback } from 'react';
import { useLoading } from '../contexts/LoadingContext';

// Base URL para la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Hook personalizado para realizar peticiones a la API
 */
const useApi = (endpoint, options = {}) => {
  const {
    fetchOnMount = true,
    initialData = null,
    withLoading = false,
    defaultParams = null
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { showLoading, hideLoading } = useLoading();

  /**
   * Función para realizar peticiones GET a la API
   */
  const fetchData = useCallback(async (customParams = {}) => {
    const params = { ...defaultParams, ...customParams };
    
    if (withLoading) {
      showLoading(params.loadingMessage || 'Cargando datos...');
    } else {
      setLoading(true);
    }
    
    try {
      // Construir la URL
      let url = `${API_BASE_URL}${endpoint}`;
      
      // Añadir query params si existen
      if (params.query) {
        const queryString = new URLSearchParams(params.query).toString();
        url = `${url}?${queryString}`;
      }
      
      console.log(`[useApi] GET ${url}`);
      
      // IMPORTANTE: Cambiar la configuración de credenciales
      // Esto es crucial para resolver el problema de CORS + credentials
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(params.headers || {})
        },
        credentials: 'same-origin' // Cambiado de 'include' a 'same-origin'
        // 'same-origin' solo enviará cookies para peticiones al mismo origen
        // 'include' intenta enviar cookies cross-origin, lo que provoca el error
      });
      
      // Verificar si la respuesta es satisfactoria
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText || 'Error desconocido'}`);
      }
      
      // Parsear la respuesta como JSON
      const result = await response.json();
      
      console.log(`[useApi] Respuesta recibida de ${endpoint}`, 
        Array.isArray(result) 
          ? `Array con ${result.length} elementos` 
          : 'Objeto'
      );
      
      // Actualizar el estado con los datos
      setData(result);
      setError(null);
      
      return result;
    } catch (err) {
      console.error(`[useApi] Error en GET ${endpoint}:`, err);
      setError(err.message || 'Error al realizar la petición');
      setData(initialData);
      return null;
    } finally {
      // Ocultar el loading al finalizar
      if (withLoading) {
        hideLoading();
      } else {
        setLoading(false);
      }
    }
  }, [endpoint, showLoading, hideLoading, withLoading, initialData, defaultParams]);

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount, fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    setData
  };
};

export default useApi;