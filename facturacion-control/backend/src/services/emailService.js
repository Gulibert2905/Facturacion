// src/services/emailService.js
const logger = require('../utils/logger');

/**
 * Servicio de email simplificado para desarrollo
 * En producción, usar servicios como SendGrid, AWS SES, etc.
 */

class EmailService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Envía email de reset de contraseña
   * @param {string} email - Email destino
   * @param {string} resetToken - Token de reset
   * @param {string} userName - Nombre del usuario
   */
  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const emailContent = {
        to: email,
        subject: 'Restablecer Contraseña - Sistema de Facturación',
        html: this.getPasswordResetTemplate(userName, resetUrl),
        text: this.getPasswordResetTextTemplate(userName, resetUrl)
      };

      if (this.isDevelopment) {
        // En desarrollo, solo loguear el contenido
        logger.info('=== EMAIL DE DESARROLLO ===');
        logger.info(`Para: ${emailContent.to}`);
        logger.info(`Asunto: ${emailContent.subject}`);
        logger.info(`URL de Reset: ${resetUrl}`);
        logger.info(`Token: ${resetToken}`);
        logger.info('=== FIN EMAIL ===');
        
        // Simular envío exitoso
        return { success: true, messageId: 'dev-' + Date.now() };
      }

      // En producción, usar servicio real de email
      return await this.sendProductionEmail(emailContent);
    } catch (error) {
      logger.error('Error enviando email de reset:', error);
      throw new Error('Error enviando email de recuperación');
    }
  }

  /**
   * Envía email de confirmación de cambio de contraseña
   * @param {string} email - Email destino
   * @param {string} userName - Nombre del usuario
   */
  async sendPasswordChangeConfirmation(email, userName) {
    try {
      const emailContent = {
        to: email,
        subject: 'Contraseña Actualizada - Sistema de Facturación',
        html: this.getPasswordChangeTemplate(userName),
        text: this.getPasswordChangeTextTemplate(userName)
      };

      if (this.isDevelopment) {
        logger.info('=== EMAIL DE CONFIRMACIÓN (DESARROLLO) ===');
        logger.info(`Para: ${emailContent.to}`);
        logger.info(`Asunto: ${emailContent.subject}`);
        logger.info('Contraseña cambiada exitosamente');
        logger.info('=== FIN EMAIL ===');
        
        return { success: true, messageId: 'dev-confirm-' + Date.now() };
      }

      return await this.sendProductionEmail(emailContent);
    } catch (error) {
      logger.error('Error enviando confirmación de cambio:', error);
      throw new Error('Error enviando confirmación');
    }
  }

  /**
   * Template HTML para reset de contraseña
   */
  getPasswordResetTemplate(userName, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Restablecer Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 4px; color: #856404; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Restablecer Contraseña</h1>
            </div>
            
            <p>Hola ${userName},</p>
            
            <p>Has solicitado restablecer tu contraseña para el Sistema de Facturación.</p>
            
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </p>
            
            <div class="warning">
                <strong>Importante:</strong> Este enlace expirará en 10 minutos por seguridad.
            </div>
            
            <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual permanecerá sin cambios.</p>
            
            <p>Si tienes problemas con el enlace, copia y pega la siguiente URL en tu navegador:</p>
            <p><small>${resetUrl}</small></p>
            
            <div class="footer">
                <p>Este es un email automático del Sistema de Facturación.<br>
                No respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Template texto plano para reset de contraseña
   */
  getPasswordResetTextTemplate(userName, resetUrl) {
    return `
Hola ${userName},

Has solicitado restablecer tu contraseña para el Sistema de Facturación.

Visita el siguiente enlace para crear una nueva contraseña:
${resetUrl}

IMPORTANTE: Este enlace expirará en 10 minutos por seguridad.

Si no solicitaste este cambio, puedes ignorar este email.

---
Sistema de Facturación
Este es un email automático. No respondas a este mensaje.
    `.trim();
  }

  /**
   * Template HTML para confirmación de cambio
   */
  getPasswordChangeTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Contraseña Actualizada</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; }
            .success { background: #d4edda; padding: 15px; border-radius: 4px; color: #155724; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Contraseña Actualizada</h1>
            </div>
            
            <p>Hola ${userName},</p>
            
            <div class="success">
                Tu contraseña ha sido actualizada exitosamente.
            </div>
            
            <p>Tu contraseña del Sistema de Facturación ha sido cambiada el ${new Date().toLocaleString('es-ES')}.</p>
            
            <p>Si no realizaste este cambio, contacta inmediatamente al administrador del sistema.</p>
            
            <div class="footer">
                <p>Este es un email automático del Sistema de Facturación.<br>
                No respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Template texto plano para confirmación
   */
  getPasswordChangeTextTemplate(userName) {
    return `
Hola ${userName},

Tu contraseña del Sistema de Facturación ha sido actualizada exitosamente el ${new Date().toLocaleString('es-ES')}.

Si no realizaste este cambio, contacta inmediatamente al administrador del sistema.

---
Sistema de Facturación
Este es un email automático. No respondas a este mensaje.
    `.trim();
  }

  /**
   * Envía email en producción (placeholder para servicio real)
   */
  async sendProductionEmail(emailContent) {
    // TODO: Implementar con servicio real como SendGrid, AWS SES, etc.
    logger.warn('Email production service not implemented yet');
    logger.info('Email que se enviaría:', emailContent);
    
    // Por ahora, simular envío exitoso
    return { success: true, messageId: 'prod-placeholder-' + Date.now() };
  }
}

module.exports = new EmailService();