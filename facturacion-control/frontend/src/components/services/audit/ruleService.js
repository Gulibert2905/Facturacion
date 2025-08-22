// src/services/audit/ruleService.js
import apiService from '../apiService';

/**
 * Servicio para gestión de reglas de auditoría
 */
const ruleService = {
  /**
   * Categorías de reglas de auditoría
   */
  ruleCategories: [
    {
      id: 'service_validation',
      name: 'Validación de Servicios',
      description: 'Reglas para validar que los servicios facturados cumplan con requisitos'
    },
    {
      id: 'contract_compliance',
      name: 'Cumplimiento de Contratos',
      description: 'Reglas para verificar cumplimiento de términos contractuales'
    },
    {
      id: 'coding_accuracy',
      name: 'Precisión de Codificación',
      description: 'Reglas para verificar precisión en la codificación de servicios y diagnósticos'
    },
    {
      id: 'tariff_validation',
      name: 'Validación de Tarifas',
      description: 'Reglas para validar tarifas aplicadas según contratos y normativas'
    },
    {
      id: 'documentation',
      name: 'Documentación Requerida',
      description: 'Reglas para verificar existencia y validez de documentación soporte'
    },
    {
      id: 'regulatory_compliance',
      name: 'Cumplimiento Normativo',
      description: 'Reglas para verificar cumplimiento de normativas del sector salud'
    }
  ],

  /**
   * Niveles de severidad de reglas
   */
  severityLevels: [
    {
      id: 'critical',
      name: 'Crítica',
      description: 'Incumplimientos que representan alto riesgo financiero o legal'
    },
    {
      id: 'high',
      name: 'Alta',
      description: 'Incumplimientos con impacto financiero significativo'
    },
    {
      id: 'medium',
      name: 'Media',
      description: 'Incumplimientos con impacto financiero moderado'
    },
    {
      id: 'low',
      name: 'Baja',
      description: 'Incumplimientos con bajo impacto financiero pero que requieren atención'
    },
    {
      id: 'info',
      name: 'Informativa',
      description: 'Observaciones sin impacto financiero directo'
    }
  ],

  /**
   * Obtiene todas las reglas de auditoría
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise} - Promesa con reglas de auditoría
   */
  getAllRules: async (filters = {}) => {
    try {
      return await apiService.get('/api/audit/rules', { params: filters });
    } catch (error) {
      console.error('Error al obtener reglas de auditoría:', error);
      throw error;
    }
  },

  /**
   * Obtiene una regla específica por ID
   * @param {string} ruleId - ID de la regla
   * @returns {Promise} - Promesa con detalles de la regla
   */
  getRuleById: async (ruleId) => {
    try {
      return await apiService.get(`/api/audit/rules/${ruleId}`);
    } catch (error) {
      console.error('Error al obtener regla por ID:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva regla de auditoría
   * @param {Object} ruleData - Datos de la regla
   * @returns {Promise} - Promesa con la regla creada
   */
  createRule: async (ruleData) => {
    try {
      return await apiService.post('/api/audit/rules', ruleData);
    } catch (error) {
      console.error('Error al crear regla:', error);
      throw error;
    }
  },

  /**
   * Actualiza una regla existente
   * @param {string} ruleId - ID de la regla
   * @param {Object} ruleData - Datos actualizados
   * @returns {Promise} - Promesa con la regla actualizada
   */
  updateRule: async (ruleId, ruleData) => {
    try {
      return await apiService.put(`/api/audit/rules/${ruleId}`, ruleData);
    } catch (error) {
      console.error('Error al actualizar regla:', error);
      throw error;
    }
  },

  /**
   * Elimina una regla
   * @param {string} ruleId - ID de la regla
   * @returns {Promise} - Promesa con resultado de la operación
   */
  deleteRule: async (ruleId) => {
    try {
      return await apiService.delete(`/api/audit/rules/${ruleId}`);
    } catch (error) {
      console.error('Error al eliminar regla:', error);
      throw error;
    }
  },

  /**
   * Activa o desactiva una regla
   * @param {string} ruleId - ID de la regla
   * @param {boolean} active - Estado de activación
   * @returns {Promise} - Promesa con resultado de la operación
   */
  toggleRuleStatus: async (ruleId, active) => {
    try {
      return await apiService.patch(`/api/audit/rules/${ruleId}/status`, { active });
    } catch (error) {
      console.error('Error al cambiar estado de regla:', error);
      throw error;
    }
  },

  /**
   * Obtiene reglas por categoría
   * @param {string} categoryId - ID de la categoría
   * @returns {Promise} - Promesa con reglas de la categoría
   */
  getRulesByCategory: async (categoryId) => {
    try {
      return await apiService.get(`/api/audit/rules/category/${categoryId}`);
    } catch (error) {
      console.error('Error al obtener reglas por categoría:', error);
      throw error;
    }
  },

  /**
   * Aplica una regla a un conjunto de datos
   * @param {string} ruleId - ID de la regla
   * @param {Object} data - Datos para aplicar la regla
   * @returns {Promise} - Promesa con resultados de la aplicación
   */
  applyRule: async (ruleId, data) => {
    try {
      return await apiService.post(`/api/audit/rules/${ruleId}/apply`, data);
    } catch (error) {
      console.error('Error al aplicar regla:', error);
      throw error;
    }
  },

  /**
   * Ejemplos predefinidos de reglas de auditoría
   * @returns {Array} - Lista de reglas predefinidas
   */
  getPredefinedRules: () => {
    return [
      {
        id: 'service_auth_validation',
        name: 'Validación de Autorización de Servicios',
        description: 'Verifica que todos los servicios facturados tengan una autorización válida',
        category: 'service_validation',
        severity: 'high',
        active: true,
        parameters: [
          {
            name: 'exclude_emergency',
            type: 'boolean',
            value: true,
            description: 'Excluir servicios de emergencia de la validación'
          }
        ]
      },
      {
        id: 'contract_rate_validation',
        name: 'Validación de Tarifas Contractuales',
        description: 'Verifica que las tarifas aplicadas correspondan a las definidas en el contrato',
        category: 'contract_compliance',
        severity: 'critical',
        active: true,
        parameters: [
          {
            name: 'tolerance_percentage',
            type: 'number',
            value: 0.5,
            description: 'Porcentaje de tolerancia para variaciones de tarifas'
          }
        ]
      },
      {
        id: 'diagnosis_procedure_consistency',
        name: 'Consistencia entre Diagnóstico y Procedimiento',
        description: 'Verifica que exista coherencia entre diagnósticos y procedimientos',
        category: 'coding_accuracy',
        severity: 'medium',
        active: true,
        parameters: []
      },
      {
        id: 'duplicate_service_detection',
        name: 'Detección de Servicios Duplicados',
        description: 'Identifica servicios facturados más de una vez para el mismo paciente',
        category: 'service_validation',
        severity: 'high',
        active: true,
        parameters: [
          {
            name: 'time_window_days',
            type: 'number',
            value: 30,
            description: 'Ventana de tiempo en días para considerar duplicados'
          }
        ]
      },
      {
        id: 'medical_history_validation',
        name: 'Validación de Historia Clínica',
        description: 'Verifica que exista registro en historia clínica para todos los servicios facturados',
        category: 'documentation',
        severity: 'high',
        active: true,
        parameters: []
      }
    ];
  }
};

export default ruleService;