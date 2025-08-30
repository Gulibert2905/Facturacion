// src/services/apiService.js
import secureStorage from '../../utils/secureStorage';

/**
 * Servicio optimizado para realizar llamadas a la API con cache y manejo de errores
 */
class ApiService {
    constructor() {
      this.baseUrl = 'http://localhost:8080/api';
      this.cache = new Map();
      this.pendingRequests = new Map();
      this.DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutos en milisegundos
    }
  
    /**
     * Realizar una petición GET con soporte para caché
     * 
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones adicionales
     * @param {boolean} options.useCache - Si debe usar caché (default: true)
     * @param {number} options.cacheTime - Tiempo de vida del caché en ms
     * @param {boolean} options.forceRefresh - Forzar actualización del caché
     * @returns {Promise<any>} - Respuesta de la API
     */
    async get(endpoint, options = {}) {
      const { 
        useCache = true, 
        cacheTime = this.DEFAULT_CACHE_TIME, 
        forceRefresh = false,
        params = null
      } = options;
      
      // Construir la URL con parámetros si se proporcionan
      let url = `${this.baseUrl}${endpoint}`;
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(key, value);
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url = `${url}?${queryString}`;
        }
      }
      
      // Clave para la caché
      const cacheKey = url;
      
      // Verificar si ya existe una petición pendiente para este endpoint
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }
      
      // Verificar si está en caché y si no ha expirado
      if (useCache && !forceRefresh && this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (Date.now() < cachedData.expiry) {
          return Promise.resolve(cachedData.data);
        }
      }
      
      // Realizar la petición
      const requestPromise = new Promise(async (resolve, reject) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
          });
          
          // Manejar respuesta
          const result = await this.handleResponse(response);
          
          // Guardar en caché si se especifica
          if (useCache) {
            this.cache.set(cacheKey, {
              data: result,
              expiry: Date.now() + cacheTime
            });
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          // Eliminar de peticiones pendientes
          this.pendingRequests.delete(cacheKey);
        }
      });
      
      // Registrar como petición pendiente
      this.pendingRequests.set(cacheKey, requestPromise);
      
      return requestPromise;
    }
  
    /**
     * Realizar una petición POST
     * 
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<any>} - Respuesta de la API
     */
    async post(endpoint, data, options = {}) {
      const { invalidateCache = [] } = options;
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data)
        });
        
        const result = await this.handleResponse(response);
        
        // Invalidar caché si se especifica
        if (invalidateCache && invalidateCache.length > 0) {
          this.invalidateCache(invalidateCache);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    }
  
    /**
     * Realizar una petición PUT
     * 
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<any>} - Respuesta de la API
     */
    async put(endpoint, data, options = {}) {
      const { invalidateCache = [] } = options;
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(data)
        });
        
        const result = await this.handleResponse(response);
        
        // Invalidar caché si se especifica
        if (invalidateCache && invalidateCache.length > 0) {
          this.invalidateCache(invalidateCache);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    }
  
    /**
     * Realizar una petición DELETE
     * 
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<any>} - Respuesta de la API
     */
    async delete(endpoint, options = {}) {
      const { invalidateCache = [] } = options;
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
        
        const result = await this.handleResponse(response);
        
        // Invalidar caché si se especifica
        if (invalidateCache && invalidateCache.length > 0) {
          this.invalidateCache(invalidateCache);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    }
  
    /**
     * Manejar la respuesta de la API
     * 
     * @param {Response} response - Respuesta de fetch
     * @returns {Promise<any>} - Datos procesados
     */
    async handleResponse(response) {
      // Si es una respuesta exitosa pero sin contenido
      if (response.status === 204) {
        return null;
      }
      
      // Para respuestas que contienen JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          this.handleError(response.status, data);
        }
        
        return data;
      }
      
      // Para respuestas que contienen Blob (archivos)
      if (contentType && (
        contentType.includes('application/pdf') ||
        contentType.includes('application/vnd.ms-excel') ||
        contentType.includes('application/vnd.openxmlformats-officedocument')
      )) {
        if (!response.ok) {
          const errorText = await response.text();
          this.handleError(response.status, { message: errorText });
        }
        
        return response.blob();
      }
      
      // Para otras respuestas
      const text = await response.text();
      
      if (!response.ok) {
        this.handleError(response.status, { message: text });
      }
      
      return text;
    }
  
    /**
     * Manejar errores de la API
     * 
     * @param {number} status - Código de estado HTTP
     * @param {Object} data - Datos del error
     */
    handleError(status, data) {
      let error = {
        status,
        message: data.message || 'Error desconocido',
        details: data.details || null
      };
      
      // Manejar tipos específicos de errores
      switch (status) {
        case 401: // No autorizado
          // Podría disparar un evento para redireccionar al login
          error.type = 'AUTH_ERROR';
          break;
        case 403: // Prohibido
          error.type = 'PERMISSION_ERROR';
          break;
        case 404: // No encontrado
          error.type = 'NOT_FOUND';
          break;
        case 422: // Error de validación
          error.type = 'VALIDATION_ERROR';
          break;
        case 500: // Error del servidor
          error.type = 'SERVER_ERROR';
          break;
        default:
          error.type = 'API_ERROR';
      }
      
      throw error;
    }
  
    /**
     * Obtener headers para las peticiones
     * 
     * @returns {Object} - Headers
     */
    getHeaders() {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Añadir token de autenticación si existe
      const token = secureStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return headers;
    }
  
    /**
     * Invalidar caché para determinados endpoints
     * 
     * @param {Array<string>} patterns - Patrones de endpoints a invalidar
     */
    invalidateCache(patterns) {
      if (!patterns || !Array.isArray(patterns)) return;
      
      for (const [key] of this.cache) {
        if (patterns.some(pattern => key.includes(pattern))) {
          this.cache.delete(key);
        }
      }
    }
  
    /**
     * Limpiar toda la caché
     */
    clearCache() {
      this.cache.clear();
    }
  }
  
  // Exportar instancia única
  export const apiService = new ApiService();
  
  // También exportar la clase para testing/extensión
  export default ApiService;