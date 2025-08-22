// src/services/__tests__/notificationService.test.js
import notificationService, { 
    NotificationType, 
    ProcessStatus 
  } from '../notificationService';
  
  // Mock de localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      })
    };
  })();
  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  describe('notificationService', () => {
    beforeEach(() => {
      // Limpiar notificaciones y mocks
      notificationService.clearAll();
      jest.clearAllMocks();
      localStorageMock.clear();
    });
    
    describe('basic functionality', () => {
      it('should add a notification with correct defaults', () => {
        // Añadir notificación
        const id = notificationService.info('Test notification');
        
        // Verificar que se añadió correctamente
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toEqual(expect.objectContaining({
          id,
          message: 'Test notification',
          type: NotificationType.INFO,
          read: false
        }));
        
        // Verificar que tiene una marca de tiempo
        expect(notifications[0].timestamp).toBeDefined();
      });
      
      it('should create notifications of different types', () => {
        // Crear diversos tipos de notificaciones
        notificationService.info('Info notification');
        notificationService.success('Success notification');
        notificationService.warning('Warning notification');
        notificationService.error('Error notification');
        notificationService.system('System notification');
        
        // Verificar que se crearon correctamente
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(5);
        
        // Verificar tipos
        const types = notifications.map(n => n.type);
        expect(types).toContain(NotificationType.INFO);
        expect(types).toContain(NotificationType.SUCCESS);
        expect(types).toContain(NotificationType.WARNING);
        expect(types).toContain(NotificationType.ERROR);
        expect(types).toContain(NotificationType.SYSTEM);
      });
      
      it('should limit the number of notifications', () => {
        // Guardar el máximo original
        const originalMax = notificationService.maxNotifications;
        
        // Establecer un máximo bajo para la prueba
        notificationService.maxNotifications = 3;
        
        // Añadir más notificaciones que el máximo
        notificationService.info('Notification 1');
        notificationService.info('Notification 2');
        notificationService.info('Notification 3');
        notificationService.info('Notification 4'); // Esta desplazará la primera
        notificationService.info('Notification 5'); // Esta desplazará la segunda
        
        // Verificar que se limitó el número
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(3);
        
        // Verificar que las más antiguas fueron eliminadas
        const messages = notifications.map(n => n.message);
        expect(messages).not.toContain('Notification 1');
        expect(messages).not.toContain('Notification 2');
        expect(messages).toContain('Notification 3');
        expect(messages).toContain('Notification 4');
        expect(messages).toContain('Notification 5');
        
        // Restaurar el máximo original
        notificationService.maxNotifications = originalMax;
      });
    });
    
    describe('persistence', () => {
      it('should save notifications to localStorage', () => {
        // Añadir notificación
        notificationService.info('Test notification');
        
        // Verificar que se guardó en localStorage
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'systemNotifications',
          expect.any(String)
        );
        
        // Verificar contenido guardado
        const savedValue = localStorageMock.setItem.mock.calls[0][1];
        const parsedValue = JSON.parse(savedValue);
        expect(parsedValue).toHaveLength(1);
        expect(parsedValue[0].message).toBe('Test notification');
      });
      
      it('should load notifications from localStorage', () => {
        // Preparar datos en localStorage
        const testNotifications = [
          {
            id: '1',
            message: 'Saved notification',
            type: NotificationType.INFO,
            read: false,
            timestamp: new Date().toISOString()
          }
        ];
        
        localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testNotifications));
        
        // Crear nueva instancia para cargar del localStorage
        const service = new notificationService.constructor();
        
        // Verificar que se cargaron los datos
        const notifications = service.getNotifications();
        expect(notifications).toHaveLength(1);
        expect(notifications[0].message).toBe('Saved notification');
      });
    });
    
    describe('notification management', () => {
      it('should update an existing notification', () => {
        // Crear notificación
        const id = notificationService.info('Original message');
        
        // Actualizar
        const success = notificationService.updateNotification(id, {
          message: 'Updated message',
          type: NotificationType.SUCCESS
        });
        
        // Verificar éxito y cambios
        expect(success).toBe(true);
        
        const notification = notificationService.getNotifications()[0];
        expect(notification.message).toBe('Updated message');
        expect(notification.type).toBe(NotificationType.SUCCESS);
      });
      
      it('should mark a notification as read', () => {
        // Crear notificación
        const id = notificationService.info('Test notification');
        
        // Marcar como leída
        const success = notificationService.markAsRead(id);
        
        // Verificar
        expect(success).toBe(true);
        
        const notification = notificationService.getNotifications()[0];
        expect(notification.read).toBe(true);
      });
      
      it('should mark all notifications as read', () => {
        // Crear múltiples notificaciones
        notificationService.info('Notification 1');
        notificationService.info('Notification 2');
        notificationService.info('Notification 3');
        
        // Marcar todas como leídas
        notificationService.markAllAsRead();
        
        // Verificar
        const notifications = notificationService.getNotifications();
        const allRead = notifications.every(n => n.read === true);
        expect(allRead).toBe(true);
      });
      
      it('should remove a notification', () => {
        // Crear notificaciones
        const id1 = notificationService.info('Notification 1');
        const id2 = notificationService.info('Notification 2');
        
        // Eliminar una
        const success = notificationService.removeNotification(id1);
        
        // Verificar
        expect(success).toBe(true);
        
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(1);
        expect(notifications[0].id).toBe(id2);
      });
      
      it('should clear all notifications', () => {
        // Crear varias notificaciones
        notificationService.info('Notification 1');
        notificationService.info('Notification 2');
        
        // Limpiar todas
        notificationService.clearAll();
        
        // Verificar
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(0);
      });
    });
    
    describe('process notifications', () => {
      it('should create process notifications with correct status', () => {
        // Crear notificaciones de proceso con diferentes estados
        notificationService.process('Pending process', ProcessStatus.PENDING);
        notificationService.process('Processing now', ProcessStatus.PROCESSING);
        notificationService.process('Completed process', ProcessStatus.COMPLETED);
        notificationService.process('Failed process', ProcessStatus.ERROR);
        
        // Verificar
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(4);
        
        // Verificar que tienen el estado correcto
        const pendingProcess = notifications.find(n => n.message === 'Pending process');
        expect(pendingProcess.processStatus).toBe(ProcessStatus.PENDING);
        
        const completedProcess = notifications.find(n => n.message === 'Completed process');
        expect(completedProcess.processStatus).toBe(ProcessStatus.COMPLETED);
        expect(completedProcess.type).toBe(NotificationType.SUCCESS);
        
        const failedProcess = notifications.find(n => n.message === 'Failed process');
        expect(failedProcess.processStatus).toBe(ProcessStatus.ERROR);
        expect(failedProcess.type).toBe(NotificationType.ERROR);
      });
      
      it('should update process status', () => {
        // Crear notificación de proceso
        const id = notificationService.process('Initial process', ProcessStatus.PENDING);
        
        // Actualizar estado
        const success = notificationService.updateProcessStatus(
          id, 
          ProcessStatus.COMPLETED, 
          'Process completed successfully'
        );
        
        // Verificar
        expect(success).toBe(true);
        
        const notification = notificationService.getNotifications()[0];
        expect(notification.processStatus).toBe(ProcessStatus.COMPLETED);
        expect(notification.type).toBe(NotificationType.SUCCESS);
        expect(notification.message).toBe('Process completed successfully');
      });
    });
    
    describe('filtering and counting', () => {
      it('should filter notifications by type', () => {
        // Crear diferentes tipos
        notificationService.info('Info notification');
        notificationService.success('Success notification');
        notificationService.warning('Warning notification');
        
        // Filtrar por tipo
        const successNotifications = notificationService.getNotifications({
          type: NotificationType.SUCCESS
        });
        
        // Verificar
        expect(successNotifications).toHaveLength(1);
        expect(successNotifications[0].message).toBe('Success notification');
      });
      
      it('should filter by read status', () => {
        // Crear notificaciones
        const id1 = notificationService.info('Notification 1');
        notificationService.info('Notification 2');
        
        // Marcar una como leída
        notificationService.markAsRead(id1);
        
        // Filtrar por no leídas
        const unreadNotifications = notificationService.getNotifications({
          read: false
        });
        
        // Verificar
        expect(unreadNotifications).toHaveLength(1);
        expect(unreadNotifications[0].message).toBe('Notification 2');
      });
      
      it('should count unread notifications', () => {
        // Sin notificaciones
        expect(notificationService.getUnreadCount()).toBe(0);
        
        // Añadir notificaciones
        const id1 = notificationService.info('Notification 1');
        notificationService.info('Notification 2');
        
        // Verificar contador
        expect(notificationService.getUnreadCount()).toBe(2);
        
        // Marcar una como leída
        notificationService.markAsRead(id1);
        
        // Verificar contador actualizado
        expect(notificationService.getUnreadCount()).toBe(1);
      });
    });
    
    describe('subscription mechanism', () => {
      it('should notify subscribers when notifications change', () => {
        // Crear función suscriptora
        const subscriber = jest.fn();
        
        // Suscribir
        const unsubscribe = notificationService.subscribe(subscriber);
        
        // Añadir notificación
        notificationService.info('Test notification');
        
        // Verificar que se llamó al suscriptor
        expect(subscriber).toHaveBeenCalled();
        expect(subscriber).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Test notification'
            })
          ])
        );
        
        // Limpiar suscripción
        unsubscribe();
        
        // Reiniciar mock
        subscriber.mockClear();
        
        // Añadir otra notificación
        notificationService.info('Another notification');
        
        // Verificar que no se llamó al suscriptor
        expect(subscriber).not.toHaveBeenCalled();
      });
    });
  });