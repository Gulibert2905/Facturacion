// src/services/notificationService.js
import { v4 as uuidv4 } from 'uuid';

/**
 * Estados de los procesos del sistema
 */
export const ProcessStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  WARNING: 'warning'
};

/**
 * Tipos de notificaciones
 */
export const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  SYSTEM: 'system'
};

/**
 * Tipos de acciones para las notificaciones
 */
export const NotificationAction = {
  VIEW: 'view',
  APPROVE: 'approve', 
  REJECT: 'reject',
  DOWNLOAD: 'download',
  RETRY: 'retry',
  DISMISS: 'dismiss'
};

/**
 * Servicio para gestión de notificaciones del sistema
 */
class NotificationService {
  constructor() {
    this.subscribers = new Set();
    this.notifications = [];
    this.maxNotifications = 100; // Máximo número de notificaciones a almacenar
    
    // Cargar notificaciones guardadas
    this.loadFromStorage();
  }
  
  /**
   * Carga las notificaciones del almacenamiento local
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('systemNotifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }
  
  /**
   * Guarda las notificaciones en el almacenamiento local
   */
  saveToStorage() {
    try {
      localStorage.setItem('systemNotifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }
  
  /**
   * Añade una notificación al sistema
   * @param {Object} notification Datos de la notificación
   * @returns {String} ID de la notificación creada
   */
  addNotification(notification) {
    const id = notification.id || uuidv4();
    const timestamp = notification.timestamp || new Date().toISOString();
    
    const newNotification = {
      id,
      timestamp,
      read: false,
      ...notification
    };
    
    // Añadir al principio del array
    this.notifications.unshift(newNotification);
    
    // Limitar el número de notificaciones
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
    
    // Persistir y notificar a suscriptores
    this.saveToStorage();
    this.notifySubscribers();
    
    return id;
  }
  
  /**
   * Crea una notificación informativa
   * @param {String} message Mensaje de la notificación
   * @param {Object} options Opciones adicionales
   * @returns {String} ID de la notificación
   */
  info(message, options = {}) {
    return this.addNotification({
      type: NotificationType.INFO,
      message,
      ...options
    });
  }
  
  /**
   * Crea una notificación de éxito
   * @param {String} message Mensaje de la notificación
   * @param {Object} options Opciones adicionales
   * @returns {String} ID de la notificación
   */
  success(message, options = {}) {
    return this.addNotification({
      type: NotificationType.SUCCESS,
      message,
      ...options
    });
  }
  
  /**
   * Crea una notificación de advertencia
   * @param {String} message Mensaje de la notificación
   * @param {Object} options Opciones adicionales
   * @returns {String} ID de la notificación
   */
  warning(message, options = {}) {
    return this.addNotification({
      type: NotificationType.WARNING,
      message,
      ...options
    });
  }
  
  /**
   * Crea una notificación de error
   * @param {String} message Mensaje de la notificación
   * @param {Object} options Opciones adicionales
   * @returns {String} ID de la notificación
   */
  error(message, options = {}) {
    return this.addNotification({
      type: NotificationType.ERROR,
      message,
      ...options
    });
  }
  
  /**
   * Crea una notificación de sistema
   * @param {String} message Mensaje de la notificación
   * @param {Object} options Opciones adicionales
   * @returns {String} ID de la notificación
   */
  system(message, options = {}) {
    return this.addNotification({
      type: NotificationType.SYSTEM,
      message,
      ...options
    });
  }
  
  /**
   * Crea una notificación de proceso
   * @param {String} message Mensaje de la notificación
   * @param {String} status Estado del proceso
   * @param {Object} options Opciones adicionales
   * @returns {String} ID de la notificación
   */
  process(message, status = ProcessStatus.PENDING, options = {}) {
    let type;
    
    switch (status) {
      case ProcessStatus.COMPLETED:
        type = NotificationType.SUCCESS;
        break;
      case ProcessStatus.ERROR:
        type = NotificationType.ERROR;
        break;
      case ProcessStatus.WARNING:
        type = NotificationType.WARNING;
        break;
      default:
        type = NotificationType.INFO;
    }
    
    return this.addNotification({
      type,
      message,
      processStatus: status,
      ...options
    });
  }
  
  /**
   * Actualiza una notificación existente
   * @param {String} id ID de la notificación a actualizar
   * @param {Object} updates Cambios a aplicar
   * @returns {Boolean} Éxito de la operación
   */
  updateNotification(id, updates) {
    const index = this.notifications.findIndex(n => n.id === id);
    
    if (index === -1) {
      return false;
    }
    
    this.notifications[index] = {
      ...this.notifications[index],
      ...updates
    };
    
    this.saveToStorage();
    this.notifySubscribers();
    
    return true;
  }
  
  /**
   * Actualiza el estado de un proceso
   * @param {String} id ID de la notificación
   * @param {String} status Nuevo estado
   * @param {String} message Nuevo mensaje (opcional)
   * @returns {Boolean} Éxito de la operación
   */
  updateProcessStatus(id, status, message) {
    const updates = { processStatus: status };
    
    let type;
    switch (status) {
      case ProcessStatus.COMPLETED:
        type = NotificationType.SUCCESS;
        break;
      case ProcessStatus.ERROR:
        type = NotificationType.ERROR;
        break;
      case ProcessStatus.WARNING:
        type = NotificationType.WARNING;
        break;
      default:
        type = NotificationType.INFO;
    }
    
    updates.type = type;
    
    if (message) {
      updates.message = message;
    }
    
    return this.updateNotification(id, updates);
  }
  
  /**
   * Marca una notificación como leída
   * @param {String} id ID de la notificación
   * @returns {Boolean} Éxito de la operación
   */
  markAsRead(id) {
    return this.updateNotification(id, { read: true });
  }
  
  /**
   * Marca todas las notificaciones como leídas
   * @returns {Boolean} Éxito de la operación
   */
  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveToStorage();
    this.notifySubscribers();
    return true;
  }
  
  /**
   * Elimina una notificación
   * @param {String} id ID de la notificación a eliminar
   * @returns {Boolean} Éxito de la operación
   */
  removeNotification(id) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    if (this.notifications.length !== initialLength) {
      this.saveToStorage();
      this.notifySubscribers();
      return true;
    }
    
    return false;
  }
  
  /**
   * Elimina todas las notificaciones
   * @returns {Boolean} Éxito de la operación
   */
  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifySubscribers();
    return true;
  }
  
  /**
   * Obtiene todas las notificaciones
   * @param {Object} options Opciones de filtrado
   * @returns {Array} Lista de notificaciones
   */
  getNotifications(options = {}) {
    let result = [...this.notifications];
    
    // Aplicar filtros si se especifican
    if (options.type) {
      result = result.filter(n => n.type === options.type);
    }
    
    if (options.read !== undefined) {
      result = result.filter(n => n.read === options.read);
    }
    
    if (options.processStatus) {
      result = result.filter(n => n.processStatus === options.processStatus);
    }
    
    // Aplicar límite si se especifica
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  /**
   * Obtiene el número de notificaciones no leídas
   * @returns {Number} Número de notificaciones no leídas
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
  
  /**
   * Suscribe una función para recibir actualizaciones
   * @param {Function} callback Función a ejecutar cuando hay cambios
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Devolver función para cancelar suscripción
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Notifica a todos los suscriptores
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.notifications);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }
}

// Exportar instancia única
const notificationService = new NotificationService();
export default notificationService;