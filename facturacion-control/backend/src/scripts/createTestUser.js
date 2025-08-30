// src/scripts/createTestUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
require('dotenv').config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Check if user already exists
        const existingUser = await User.findOne({ username: 'admin_test' });
        if (existingUser) {
            console.log('Usuario de prueba ya existe');
            console.log('Username: admin_test');
            console.log('Password: admin123');
            return;
        }

        // Create test user with email
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const testUser = await User.create({
            username: 'admin_test',
            email: 'admin@test.com',
            password: hashedPassword,
            fullName: 'Administrador Test',
            role: 'admin',
            department: 'TI',
            phone: '123456789',
            active: true
        });

        console.log('Usuario de prueba creado exitosamente:');
        console.log('Username: admin_test');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        console.log('Role: admin');
        console.log('ID:', testUser._id);

    } catch (error) {
        console.error('Error al crear usuario de prueba:', error.message);
        if (error.code === 11000) {
            console.log('El usuario o email ya existe en la base de datos');
        }
    } finally {
        await mongoose.disconnect();
    }
};

createTestUser();