// src/middleware/companyAccess.js
const { User } = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware para filtrar datos por empresas asignadas al usuario
 * Agrega al objeto req los filtros necesarios para limitar consultas por empresa
 */
const companyAccessMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        // Obtener el usuario completo con las empresas asignadas
        const user = await User.findById(req.user.id).populate('assignedCompanies');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Determinar las empresas accesibles
        const accessibleCompanies = user.getAccessibleCompanies();
        
        // Agregar información de empresas accesibles al request
        req.userCompanyAccess = {
            canViewAllCompanies: accessibleCompanies === 'all',
            assignedCompanies: accessibleCompanies === 'all' ? [] : accessibleCompanies,
            user: user
        };

        // Función helper para crear filtros de empresa en consultas MongoDB
        req.createCompanyFilter = (additionalFilters = {}) => {
            if (req.userCompanyAccess.canViewAllCompanies) {
                return additionalFilters; // Sin restricción de empresa
            }
            
            // Filtrar por empresas asignadas
            return {
                ...additionalFilters,
                company: { $in: req.userCompanyAccess.assignedCompanies }
            };
        };

        next();
    } catch (error) {
        logger.error('Error en middleware de acceso por empresa:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Middleware para verificar acceso a una empresa específica
 * Se debe usar cuando se requiere acceso a una empresa específica (ej: /api/company/:id)
 */
const requireCompanyAccess = (companyIdParam = 'companyId') => {
    return async (req, res, next) => {
        try {
            const companyId = req.params[companyIdParam] || req.body.company || req.query.company;
            
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de empresa requerido'
                });
            }

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Obtener el usuario completo
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si puede acceder a esta empresa específica
            if (!user.canAccessCompany(companyId)) {
                logger.warn(`Usuario ${user.username} intentó acceder a empresa ${companyId} sin permisos`);
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a esta empresa'
                });
            }

            next();
        } catch (error) {
            logger.error('Error en middleware de acceso específico a empresa:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
};

/**
 * Función helper para filtrar resultados por empresa en el backend
 * Útil para filtrar arrays de datos ya obtenidos
 */
const filterByUserCompanies = (data, req, companyField = 'company') => {
    if (req.userCompanyAccess.canViewAllCompanies) {
        return data;
    }
    
    const allowedCompanyIds = req.userCompanyAccess.assignedCompanies.map(id => id.toString());
    
    return data.filter(item => {
        const itemCompanyId = item[companyField] ? item[companyField].toString() : null;
        return itemCompanyId && allowedCompanyIds.includes(itemCompanyId);
    });
};

module.exports = {
    companyAccessMiddleware,
    requireCompanyAccess,
    filterByUserCompanies
};