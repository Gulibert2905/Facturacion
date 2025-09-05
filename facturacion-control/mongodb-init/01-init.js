// Script de inicialización para MongoDB
// Este script crea la base de datos y un usuario administrador inicial

// Conectar a la base de datos facturacion
db = db.getSiblingDB('facturacion');

// Crear colecciones básicas
db.createCollection('users');
db.createCollection('companies');
db.createCollection('patients');
db.createCollection('servicerecords');

// Crear usuario super administrador inicial
// Nota: La contraseña debe ser hasheada antes de insertar en producción
const bcrypt = require('bcryptjs');

// Función auxiliar para hashear password (simulada para este ejemplo)
const initialUser = {
    username: 'admin',
    email: 'admin@facturacion.com',
    // Password: Admin123! (debe ser hasheada)
    password: '$2b$12$LQv3c1yqBwEHxv0fSIlJSe6sVSxXs/lh4fcxZb.JhI6DQ4tRp8Wjy',
    fullName: 'Administrador del Sistema',
    role: 'superadmin',
    department: 'Sistemas',
    phone: '',
    active: true,
    canViewAllCompanies: true,
    assignedCompanies: [],
    customPermissions: [],
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Insertar usuario inicial si no existe
const existingUser = db.users.findOne({ username: 'admin' });
if (!existingUser) {
    db.users.insertOne(initialUser);
    print('Usuario administrador inicial creado: admin / Admin123!');
} else {
    print('Usuario administrador ya existe');
}

// Crear índices importantes
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.companies.createIndex({ nit: 1 }, { unique: true });
db.patients.createIndex({ documentNumber: 1, documentType: 1 }, { unique: true });

print('Base de datos inicializada correctamente');