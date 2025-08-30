// backend/src/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Construir URI de conexión con autenticación si está disponible
        let mongoUri = process.env.MONGODB_URI;
        
        if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
            const url = new URL(mongoUri);
            url.username = process.env.MONGODB_USER;
            url.password = process.env.MONGODB_PASSWORD;
            mongoUri = url.toString();
        }

        // Opciones de conexión segura
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Usar IPv4
            retryWrites: true,
            w: 'majority'
        };

        const conn = await mongoose.connect(mongoUri, options);
        logger.info(`MongoDB conectada: ${conn.connection.host}`);
        
        // Manejar eventos de conexión
        mongoose.connection.on('error', (error) => {
            logger.error('Error de conexión MongoDB:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB desconectada');
        });

    } catch (error) {
        logger.error(`Error conectando a MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;