// src/components/services/authService.js
import { apiService } from './apiService';
import secureStorage from '../../utils/secureStorage';

/**
 * Servicio para manejo de autenticación
 */
const authService = {
  /**
   * Realiza login del usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise} - Promesa con datos del usuario autenticado
   */
  login: async (username, password) => {
    try {
      const response = await apiService.post('/auth/login', {
        username,
        password
      });

      if (response.success && response.token) {
        // Guardar token y datos del usuario usando almacenamiento seguro
        secureStorage.setItem('token', response.token, 30); // 30 minutos
        secureStorage.setItem('user', JSON.stringify(response.user), 30);
        
        return response;
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  /**
   * Cierra sesión del usuario
   */
  logout: () => {
    secureStorage.removeItem('token');
    secureStorage.removeItem('user');
    // Limpiar caché de API
    apiService.clearCache();
  },

  /**
   * Obtiene el usuario actual desde localStorage
   * @returns {Object|null} - Datos del usuario o null si no está autenticado
   */
  getCurrentUser: () => {
    const userStr = secureStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error al parsear usuario desde almacenamiento seguro:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} - True si está autenticado
   */
  isAuthenticated: () => {
    const token = secureStorage.getItem('token');
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  /**
   * Obtiene el token de autenticación
   * @returns {string|null} - Token o null si no existe
   */
  getToken: () => {
    return secureStorage.getItem('token');
  },

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string} role - Rol a verificar
   * @returns {boolean} - True si tiene el rol
   */
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user && user.role === role;
  },

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission - Permiso a verificar
   * @returns {boolean} - True si tiene el permiso
   */
  hasPermission: (permission) => {
    const user = authService.getCurrentUser();
    return user && user.permissions && user.permissions.includes(permission);
  },

  /**
   * Registra un nuevo usuario (solo admin)
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} - Promesa con datos del usuario creado
   */
  register: async (userData) => {
    try {
      const response = await apiService.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  /**
   * Realiza petición GET a la API
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} - Promesa con datos de la respuesta
   */
  get: async (endpoint, options = {}) => {
    try {
      const response = await apiService.get(endpoint, options);
      return response;
    } catch (error) {
      console.error('Error en GET:', error);
      throw error;
    }
  },

  /**
   * Realiza petición PUT a la API
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} - Promesa con datos de la respuesta
   */
  put: async (endpoint, data, options = {}) => {
    try {
      const response = await apiService.put(endpoint, data, options);
      return response;
    } catch (error) {
      console.error('Error en PUT:', error);
      throw error;
    }
  },

  /**
   * Realiza petición POST a la API
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} - Promesa con datos de la respuesta
   */
  post: async (endpoint, data, options = {}) => {
    try {
      const response = await apiService.post(endpoint, data, options);
      return response;
    } catch (error) {
      console.error('Error en POST:', error);
      throw error;
    }
  },

  /**
   * Realiza petición DELETE a la API
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} - Promesa con datos de la respuesta
   */
  delete: async (endpoint, options = {}) => {
    try {
      const response = await apiService.delete(endpoint, options);
      return response;
    } catch (error) {
      console.error('Error en DELETE:', error);
      throw error;
    }
  }
};

export default authService;