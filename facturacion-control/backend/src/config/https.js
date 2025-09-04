const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Configuración HTTPS para producción
 */
const setupHTTPS = (app) => {
    if (process.env.HTTPS_ENABLED !== 'true') {
        logger.info('HTTPS deshabilitado, usando HTTP');
        return null;
    }

    try {
        const certPath = process.env.SSL_CERT_PATH;
        const keyPath = process.env.SSL_KEY_PATH;

        if (!certPath || !keyPath) {
            logger.error('SSL_CERT_PATH y SSL_KEY_PATH deben estar configurados para HTTPS');
            return null;
        }

        // Verificar que los archivos SSL existen
        if (!fs.existsSync(certPath)) {
            logger.error(`Certificado SSL no encontrado en: ${certPath}`);
            return null;
        }

        if (!fs.existsSync(keyPath)) {
            logger.error(`Clave privada SSL no encontrada en: ${keyPath}`);
            return null;
        }

        const options = {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };

        // Opcionalmente, agregar CA certificate si existe
        const caPath = process.env.SSL_CA_PATH;
        if (caPath && fs.existsSync(caPath)) {
            options.ca = fs.readFileSync(caPath);
        }

        const httpsServer = https.createServer(options, app);

        logger.info('HTTPS configurado correctamente');
        return httpsServer;

    } catch (error) {
        logger.error({
            type: 'https_setup_error',
            error: error.message,
            stack: error.stack
        });
        return null;
    }
};

/**
 * Middleware para redireccionar HTTP a HTTPS en producción
 */
const httpsRedirect = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true') {
        if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
            const httpsUrl = `https://${req.get('host')}${req.url}`;
            logger.info({
                type: 'https_redirect',
                from: req.url,
                to: httpsUrl,
                ip: req.ip
            });
            return res.redirect(301, httpsUrl);
        }
    }
    next();
};

/**
 * Generar certificados self-signed para desarrollo
 */
const generateSelfSignedCert = () => {
    const forge = require('node-forge');
    
    // Generar par de claves
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Crear certificado
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{
        name: 'commonName',
        value: 'localhost'
    }, {
        name: 'countryName',
        value: 'CO'
    }, {
        name: 'organizationName',
        value: 'Sistema Facturación'
    }];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);
    
    return {
        cert: forge.pki.certificateToPem(cert),
        key: forge.pki.privateKeyToPem(keys.privateKey)
    };
};

/**
 * Script para generar certificados Let's Encrypt
 */
const letsEncryptInstructions = () => {
    return `
🔒 CONFIGURACIÓN SSL CON LET'S ENCRYPT

1. Instalar Certbot:
   sudo apt update
   sudo apt install snapd
   sudo snap install --classic certbot

2. Generar certificado:
   sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

3. Configurar renovación automática:
   sudo crontab -e
   Agregar: 0 12 * * * /usr/bin/certbot renew --quiet

4. Configurar variables de entorno:
   SSL_CERT_PATH=/etc/letsencrypt/live/tu-dominio.com/fullchain.pem
   SSL_KEY_PATH=/etc/letsencrypt/live/tu-dominio.com/privkey.pem

5. Reiniciar el servidor
`;
};

module.exports = {
    setupHTTPS,
    httpsRedirect,
    generateSelfSignedCert,
    letsEncryptInstructions
};