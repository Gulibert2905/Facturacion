const bcrypt = require('bcryptjs');
const { User, MODULES, ACTIONS } = require('../models/User');
const logger = require('../utils/logger');

/**
 * Obtener todos los usuarios (solo superadmin/admin)
 */
const getUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            role, 
            active, 
            search,
            sortBy = 'fullName',
            sortOrder = 'asc'
        } = req.query;

        // Construir filtros
        const filter = {};
        
        if (role) filter.role = role;
        if (active !== undefined && active !== 'all') {
            filter.active = active === 'true';
        }
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } }
            ];
        }

        // Configurar paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Ejecutar consulta
        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .populate('createdBy', 'fullName username')
                .populate('updatedBy', 'fullName username')
                .populate('assignedCompanies', 'nombre nit codigo estado')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        // Agregar información de permisos
        const usersWithPermissions = users.map(user => ({
            ...user.toObject(),
            permissions: user.getPermissions(),
            isLocked: user.isLocked()
        }));

        logger.info({
            type: 'users_listed',
            userId: req.user._id,
            filters: filter,
            count: users.length,
            total
        });

        res.json({
            users: usersWithPermissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error({
            type: 'get_users_error',
            error: error.message,
            userId: req.user._id
        });
        res.status(500).json({ 
            message: 'Error al obtener usuarios',
            error: error.message 
        });
    }
};

/**
 * Obtener un usuario específico
 */
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('createdBy', 'fullName username')
            .populate('updatedBy', 'fullName username')
            .populate('assignedCompanies', 'nombre nit codigo estado');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const userWithPermissions = {
            ...user.toObject(),
            permissions: user.getPermissions(),
            isLocked: user.isLocked()
        };

        res.json(userWithPermissions);
    } catch (error) {
        logger.error({
            type: 'get_user_error',
            error: error.message,
            userId: req.user._id,
            targetUserId: req.params.id
        });
        res.status(500).json({ 
            message: 'Error al obtener usuario',
            error: error.message 
        });
    }
};

/**
 * Crear nuevo usuario
 */
const createUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            fullName,
            role,
            department,
            phone,
            customPermissions,
            assignedCompanies,
            canViewAllCompanies
        } = req.body;

        // Validar campos requeridos
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({
                message: 'Username, email, password y fullName son requeridos'
            });
        }

        // Verificar si ya existe usuario o email
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.username === username 
                    ? 'Username ya existe' 
                    : 'Email ya existe'
            });
        }

        // Hashear password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Preparar datos del usuario
        const userData = {
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            fullName: fullName.trim(),
            role: role || 'facturador',
            department: department || '',
            phone: phone || '',
            createdBy: req.user._id,
            canViewAllCompanies: canViewAllCompanies || false,
            assignedCompanies: canViewAllCompanies ? [] : (assignedCompanies || [])
        };

        // Si es rol custom, agregar permisos personalizados
        if (role === 'custom' && customPermissions) {
            userData.customPermissions = customPermissions;
        }

        const user = new User(userData);
        await user.save();
        
        // Poblar empresas asignadas para la respuesta
        await user.populate('assignedCompanies', 'nombre nit codigo estado');

        // Respuesta sin password
        const userResponse = {
            ...user.toObject(),
            permissions: user.getPermissions()
        };
        delete userResponse.password;

        logger.info({
            type: 'user_created',
            createdBy: req.user._id,
            newUserId: user._id,
            username: user.username,
            role: user.role
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: userResponse
        });
    } catch (error) {
        logger.error({
            type: 'create_user_error',
            error: error.message,
            createdBy: req.user._id,
            userData: req.body
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Error de validación',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        res.status(500).json({ 
            message: 'Error al crear usuario',
            error: error.message 
        });
    }
};

/**
 * Actualizar usuario
 */
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        // No permitir actualizar password aquí
        delete updates.password;
        delete updates.username; // Username no se puede cambiar

        // Agregar metadatos
        updates.updatedBy = req.user._id;

        // Si se está actualizando canViewAllCompanies a true, limpiar assignedCompanies
        if (updates.canViewAllCompanies === true) {
            updates.assignedCompanies = [];
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password')
        .populate('assignedCompanies', 'nombre nit codigo estado');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const userWithPermissions = {
            ...user.toObject(),
            permissions: user.getPermissions(),
            isLocked: user.isLocked()
        };

        logger.info({
            type: 'user_updated',
            updatedBy: req.user._id,
            targetUserId: userId,
            updates: Object.keys(updates)
        });

        res.json({
            message: 'Usuario actualizado exitosamente',
            user: userWithPermissions
        });
    } catch (error) {
        logger.error({
            type: 'update_user_error',
            error: error.message,
            updatedBy: req.user._id,
            targetUserId: req.params.id
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Error de validación',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        res.status(500).json({ 
            message: 'Error al actualizar usuario',
            error: error.message 
        });
    }
};

/**
 * Cambiar password de usuario
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Password actual y nuevo son requeridos'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar password actual (solo si no es admin cambiando password de otro)
        const isOwnPassword = req.user._id.toString() === userId;
        if (isOwnPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Password actual incorrecto' });
            }
        }

        // Hashear nuevo password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        user.updatedBy = req.user._id;
        await user.save();

        logger.info({
            type: 'password_changed',
            changedBy: req.user._id,
            targetUserId: userId,
            isOwnPassword
        });

        res.json({ message: 'Password actualizado exitosamente' });
    } catch (error) {
        logger.error({
            type: 'change_password_error',
            error: error.message,
            changedBy: req.user._id,
            targetUserId: req.params.id
        });
        res.status(500).json({ 
            message: 'Error al cambiar password',
            error: error.message 
        });
    }
};

/**
 * Activar/Desactivar usuario
 */
const toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // No permitir desactivar al propio usuario
        if (req.user._id.toString() === userId && user.active) {
            return res.status(400).json({ 
                message: 'No puedes desactivar tu propia cuenta' 
            });
        }

        user.active = !user.active;
        user.updatedBy = req.user._id;
        await user.save();

        logger.info({
            type: user.active ? 'user_activated' : 'user_deactivated',
            actionBy: req.user._id,
            targetUserId: userId,
            targetUsername: user.username
        });

        res.json({
            message: `Usuario ${user.active ? 'activado' : 'desactivado'} exitosamente`,
            user: {
                ...user.toObject(),
                permissions: user.getPermissions(),
                isLocked: user.isLocked()
            }
        });
    } catch (error) {
        logger.error({
            type: 'toggle_user_status_error',
            error: error.message,
            actionBy: req.user._id,
            targetUserId: req.params.id
        });
        res.status(500).json({ 
            message: 'Error al cambiar estado del usuario',
            error: error.message 
        });
    }
};

/**
 * Obtener roles disponibles y módulos del sistema
 */
const getSystemInfo = async (req, res) => {
    try {
        const roles = [
            {
                value: 'superadmin',
                label: 'Super Administrador',
                description: 'Acceso total al sistema'
            },
            {
                value: 'admin',
                label: 'Administrador',
                description: 'Gestión general sin configuraciones críticas'
            },
            {
                value: 'facturador',
                label: 'Facturador',
                description: 'Manejo de pacientes, servicios y prefacturas'
            },
            {
                value: 'auditor',
                label: 'Auditor',
                description: 'Acceso de lectura y funciones de auditoría'
            },
            {
                value: 'reportes',
                label: 'Reportes',
                description: 'Solo visualización de reportes y dashboards'
            },
            {
                value: 'rips',
                label: 'RIPS',
                description: 'Generación y validación de archivos RIPS'
            },
            {
                value: 'custom',
                label: 'Personalizado',
                description: 'Permisos específicos configurados manualmente'
            }
        ];

        const modules = Object.entries(MODULES).map(([key, value]) => ({
            key,
            value,
            label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')
        }));

        const actions = Object.entries(ACTIONS).map(([key, value]) => ({
            key,
            value,
            label: key.charAt(0) + key.slice(1).toLowerCase()
        }));

        res.json({
            roles,
            modules,
            actions
        });
    } catch (error) {
        logger.error({
            type: 'get_system_info_error',
            error: error.message,
            userId: req.user._id
        });
        res.status(500).json({ 
            message: 'Error al obtener información del sistema',
            error: error.message 
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    changePassword,
    toggleUserStatus,
    getSystemInfo
};