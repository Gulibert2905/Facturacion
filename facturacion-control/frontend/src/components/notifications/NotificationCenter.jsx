// src/components/notifications/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  ListItemSecondaryAction,
  Divider,
  Button,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  Done,
  Download,
  Refresh,
  DeleteSweep
} from '@mui/icons-material';

import notificationService, { 
  NotificationType, 
  ProcessStatus,
  NotificationAction
} from '../../components/services/notificationService';

/**
 * Componente que muestra el ícono de notificaciones y el panel desplegable
 */
const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  
  // Actualizar el estado cuando cambian las notificaciones
  useEffect(() => {
    const updateNotifications = (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    };
    
    // Inicializar
    updateNotifications(notificationService.getNotifications());
    
    // Suscribirse a cambios
    const unsubscribe = notificationService.subscribe(updateNotifications);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Manejar clic en el ícono
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Cerrar el panel
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Marcar todas como leídas
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };
  
  // Limpiar todas las notificaciones
  const handleClearAll = () => {
    notificationService.clearAll();
    handleClose();
  };
  
  // Manejar cambio de tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Marcar una notificación como leída
  const handleMarkAsRead = (id) => {
    notificationService.markAsRead(id);
  };
  
  // Eliminar una notificación
  const handleRemove = (id) => {
    notificationService.removeNotification(id);
  };
  
  // Manejar acción en una notificación
  const handleAction = (notification, action) => {
    if (notification.onAction) {
      notification.onAction(action, notification);
    }
    
    // Marcar como leída en caso de acción
    notificationService.markAsRead(notification.id);
  };
  
  // Obtener ícono según el tipo de notificación
  const getNotificationIcon = (type, processStatus) => {
    // Si es un proceso en curso, mostrar spinner
    if (processStatus === ProcessStatus.PROCESSING) {
      return <CircularProgress size={20} />;
    }
    
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle color="success" />;
      case NotificationType.ERROR:
        return <Error color="error" />;
      case NotificationType.WARNING:
        return <Warning color="warning" />;
      case NotificationType.SYSTEM:
        return <Notifications color="secondary" />;
      default:
        return <Info color="info" />;
    }
  };
  
  // Filtrar notificaciones según la pestaña seleccionada
  const getFilteredNotifications = () => {
    switch (tabValue) {
      case 0: // Todas
        return notifications;
      case 1: // No leídas
        return notifications.filter(n => !n.read);
      case 2: // Procesos
        return notifications.filter(n => n.processStatus !== undefined);
      default:
        return notifications;
    }
  };
  
  // Renderizar botones de acción
  const renderActionButtons = (notification) => {
    const { actions = [] } = notification;
    
    if (actions.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        {actions.map((action, index) => {
          let icon;
          
          switch (action.type) {
            case NotificationAction.VIEW:
              icon = <Info fontSize="small" />;
              break;
            case NotificationAction.APPROVE:
              icon = <Done fontSize="small" />;
              break;
            case NotificationAction.REJECT:
              icon = <Close fontSize="small" />;
              break;
            case NotificationAction.DOWNLOAD:
              icon = <Download fontSize="small" />;
              break;
            case NotificationAction.RETRY:
              icon = <Refresh fontSize="small" />;
              break;
            default:
              icon = null;
          }
          
          return (
            <Button
              key={index}
              size="small"
              variant={action.primary ? "contained" : "outlined"}
              startIcon={icon}
              onClick={() => handleAction(notification, action.type)}
              color={action.color || "primary"}
            >
              {action.label}
            </Button>
          );
        })}
      </Box>
    );
  };
  
  const open = Boolean(anchorEl);
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          color="inherit"
          onClick={handleClick}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notificaciones</Typography>
          <Box>
            <Tooltip title="Marcar todas como leídas">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <Done />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar todas">
              <IconButton size="small" onClick={handleClearAll}>
                <DeleteSweep />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todas" />
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error">
                <Typography variant="body2">No leídas</Typography>
              </Badge>
            } 
            disabled={unreadCount === 0}
          />
          <Tab label="Procesos" />
        </Tabs>
        
        {filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 350, overflow: 'auto' }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: !notification.read ? 'action.hover' : 'transparent',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type, notification.processStatus)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ pr: 4, fontWeight: !notification.read ? 'bold' : 'normal' }}>
                        {notification.title || 'Notificación'}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" component="span">
                          {notification.message}
                        </Typography>
                        
                        {notification.processStatus && (
                          <Chip
                            label={notification.processStatus}
                            size="small"
                            color={
                              notification.processStatus === ProcessStatus.COMPLETED ? "success" :
                              notification.processStatus === ProcessStatus.ERROR ? "error" :
                              notification.processStatus === ProcessStatus.WARNING ? "warning" : "default"
                            }
                            sx={{ ml: 1, mt: 0.5 }}
                          />
                        )}
                        
                        {notification.timestamp && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        )}
                        
                        {renderActionButtons(notification)}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Eliminar">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemove(notification.id)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;