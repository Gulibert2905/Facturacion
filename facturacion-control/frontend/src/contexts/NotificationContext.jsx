// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

// Crear el contexto
const NotificationContext = createContext();

/**
 * Tipos de notificaciones:
 * - success: Operación exitosa
 * - error: Error en la operación
 * - warning: Advertencia
 * - info: Información general
 */

/**
 * Proveedor para el sistema de notificaciones
 */
export const NotificationProvider = ({ children }) => {
  // Estado para las notificaciones
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  // Añadir una nueva notificación
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      message: notification.message || 'Notificación',
      type: notification.type || 'info',
      title: notification.title || '',
      autoHideDuration: notification.autoHideDuration || 5000,
      position: notification.position || { vertical: 'bottom', horizontal: 'right' }
    };

    setNotifications(prev => [...prev, newNotification]);

    // Si no hay notificación activa, mostrar ésta inmediatamente
    if (!open) {
      setCurrent(newNotification);
      setOpen(true);
    }

    return id;
  }, [open]);

  // Cerrar la notificación actual
  const handleClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setOpen(false);

    // Comprobar si hay más notificaciones en cola
    setTimeout(() => {
      setNotifications(prev => {
        const updatedNotifications = prev.filter(n => n.id !== current?.id);

        // Si hay más notificaciones, mostrar la siguiente
        if (updatedNotifications.length > 0) {
          setCurrent(updatedNotifications[0]);
          setOpen(true);
        } else {
          setCurrent(null);
        }

        return updatedNotifications;
      });
    }, 300);
  }, [current]);

  // Métodos de conveniencia para diferentes tipos de notificaciones
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'success',
      title: options.title || 'Éxito',
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'error',
      title: options.title || 'Error',
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'warning',
      title: options.title || 'Advertencia',
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'info',
      title: options.title || 'Información',
      ...options
    });
  }, [addNotification]);

  // Eliminar una notificación específica por ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Si la notificación actual es la que se está eliminando, cerrarla
    if (current?.id === id) {
      setOpen(false);
    }
  }, [current]);

  // Eliminar todas las notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setOpen(false);
    setCurrent(null);
  }, []);

  // Valor a exponer en el contexto
  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Componente de UI para mostrar notificaciones */}
      {current && (
        <Snackbar
          open={open}
          autoHideDuration={current.autoHideDuration}
          onClose={handleClose}
          anchorOrigin={current.position}
        >
          <Alert 
            onClose={handleClose} 
            severity={current.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {current.title && <AlertTitle>{current.title}</AlertTitle>}
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar el contexto de notificaciones
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
  }
  return context;
};