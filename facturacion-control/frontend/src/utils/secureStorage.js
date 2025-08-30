// src/utils/secureStorage.js

/**
 * Utilidad para almacenamiento seguro de tokens
 * Proporciona una interfaz unificada que puede cambiar entre localStorage,
 * sessionStorage o cookies según las necesidades de seguridad
 */

class SecureStorage {
  constructor() {
    this.storageType = this.getStorageType();
  }

  /**
   * Determina el tipo de almacenamiento más seguro disponible
   * @returns {string} - Tipo de almacenamiento
   */
  getStorageType() {
    // En producción, preferir cookies seguras
    // En desarrollo, usar sessionStorage para mayor seguridad que localStorage
    if (process.env.NODE_ENV === 'production') {
      return 'cookies';
    }
    return 'sessionStorage';
  }

  /**
   * Almacena un valor de forma segura
   * @param {string} key - Clave
   * @param {string} value - Valor
   * @param {number} expireMinutes - Minutos hasta expiración (opcional)
   */
  setItem(key, value, expireMinutes = 30) {
    const data = {
      value,
      timestamp: Date.now(),
      expireMinutes
    };

    switch (this.storageType) {
      case 'cookies':
        this.setCookie(key, JSON.stringify(data), expireMinutes);
        break;
      case 'sessionStorage':
        sessionStorage.setItem(key, JSON.stringify(data));
        break;
      default:
        localStorage.setItem(key, JSON.stringify(data));
    }
  }

  /**
   * Obtiene un valor del almacenamiento seguro
   * @param {string} key - Clave
   * @returns {string|null} - Valor o null si no existe o expiró
   */
  getItem(key) {
    let dataStr = null;

    switch (this.storageType) {
      case 'cookies':
        dataStr = this.getCookie(key);
        break;
      case 'sessionStorage':
        dataStr = sessionStorage.getItem(key);
        break;
      default:
        dataStr = localStorage.getItem(key);
    }

    if (!dataStr) return null;

    try {
      const data = JSON.parse(dataStr);
      
      // Verificar si ha expirado
      if (this.isExpired(data)) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Error parsing stored data:', error);
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remueve un item del almacenamiento
   * @param {string} key - Clave
   */
  removeItem(key) {
    switch (this.storageType) {
      case 'cookies':
        this.deleteCookie(key);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(key);
        break;
      default:
        localStorage.removeItem(key);
    }
  }

  /**
   * Limpia todo el almacenamiento seguro
   */
  clear() {
    switch (this.storageType) {
      case 'cookies':
        // Limpiar cookies específicas de la app
        this.removeItem('token');
        this.removeItem('user');
        break;
      case 'sessionStorage':
        sessionStorage.clear();
        break;
      default:
        localStorage.clear();
    }
  }

  /**
   * Verifica si los datos han expirado
   * @param {Object} data - Datos almacenados
   * @returns {boolean} - True si expiró
   */
  isExpired(data) {
    if (!data.timestamp || !data.expireMinutes) return false;
    
    const now = Date.now();
    const expireTime = data.timestamp + (data.expireMinutes * 60 * 1000);
    
    return now > expireTime;
  }

  /**
   * Establece una cookie
   * @param {string} name - Nombre
   * @param {string} value - Valor
   * @param {number} expireMinutes - Minutos hasta expiración
   */
  setCookie(name, value, expireMinutes) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (expireMinutes * 60 * 1000));
    
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const sameSite = '; SameSite=Strict';
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/${secure}; HttpOnly=false${sameSite}`;
  }

  /**
   * Obtiene una cookie
   * @param {string} name - Nombre
   * @returns {string|null} - Valor o null
   */
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Elimina una cookie
   * @param {string} name - Nombre
   */
  deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export default new SecureStorage();