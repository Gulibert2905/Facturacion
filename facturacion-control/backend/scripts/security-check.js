#!/usr/bin/env node
/**
 * Script de verificación de seguridad
 * Valida que el sistema esté configurado correctamente para producción
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config();

class SecurityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  addIssue(category, message, severity = 'HIGH') {
    this.issues.push({ category, message, severity });
  }

  addWarning(category, message) {
    this.warnings.push({ category, message });
  }

  addPassed(category, message) {
    this.passed.push({ category, message });
  }

  checkEnvironmentVariables() {
    console.log('\n🔍 Verificando Variables de Entorno...');

    // Variables críticas que deben existir
    const requiredVars = [
      'JWT_SECRET',
      'MONGODB_URI',
      'NODE_ENV',
      'ALLOWED_ORIGINS',
      'FRONTEND_URL'
    ];

    const productionVars = [
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX_REQUESTS',
      'LOGIN_RATE_LIMIT_WINDOW_MS',
      'LOGIN_RATE_LIMIT_MAX_ATTEMPTS'
    ];

    // Verificar variables requeridas
    for (const envVar of requiredVars) {
      if (!process.env[envVar]) {
        this.addIssue('ENV', `Variable ${envVar} no definida`);
      } else {
        this.addPassed('ENV', `Variable ${envVar} definida`);
      }
    }

    // Verificar JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      if (jwtSecret.length < 32) {
        this.addIssue('CRYPTO', 'JWT_SECRET demasiado corto (mínimo 32 caracteres)');
      } else if (jwtSecret.includes('CHANGE_ME')) {
        this.addIssue('CRYPTO', 'JWT_SECRET contiene placeholder, debe cambiarse');
      } else if (jwtSecret.length < 64) {
        this.addWarning('CRYPTO', 'JWT_SECRET podría ser más largo (recomendado 64+ caracteres)');
      } else {
        this.addPassed('CRYPTO', 'JWT_SECRET tiene longitud adecuada');
      }
    }

    // Verificar NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      for (const envVar of productionVars) {
        if (!process.env[envVar]) {
          this.addWarning('PROD', `Variable ${envVar} no definida para producción`);
        } else {
          this.addPassed('PROD', `Variable ${envVar} definida para producción`);
        }
      }
    }

    // Verificar CORS
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (allowedOrigins && allowedOrigins.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.addIssue('CORS', 'ALLOWED_ORIGINS contiene localhost en producción');
    }
  }

  checkFilePermissions() {
    console.log('\n🔍 Verificando Permisos de Archivos...');

    const sensitiveFiles = [
      '.env',
      'logs/error.log',
      'logs/combined.log'
    ];

    for (const file of sensitiveFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode & parseInt('777', 8);
          
          if (mode > parseInt('600', 8)) {
            this.addWarning('PERMISSIONS', `${file} tiene permisos demasiado abiertos (${mode.toString(8)})`);
          } else {
            this.addPassed('PERMISSIONS', `${file} tiene permisos adecuados`);
          }
        } catch (error) {
          this.addWarning('PERMISSIONS', `No se pudieron verificar permisos de ${file}`);
        }
      }
    }
  }

  checkSecurityHeaders() {
    console.log('\n🔍 Verificando Configuración de Seguridad...');

    // Verificar que helmet esté instalado
    try {
      require('helmet');
      this.addPassed('HEADERS', 'Helmet.js está instalado');
    } catch {
      this.addIssue('HEADERS', 'Helmet.js no está instalado');
    }

    // Verificar configuración de app.js
    const appJsPath = path.join(__dirname, '..', 'src', 'app.js');
    if (fs.existsSync(appJsPath)) {
      const appJsContent = fs.readFileSync(appJsPath, 'utf8');
      
      if (appJsContent.includes('helmet(')) {
        this.addPassed('HEADERS', 'Helmet configurado en app.js');
      } else {
        this.addIssue('HEADERS', 'Helmet no configurado en app.js');
      }

      if (appJsContent.includes('cors(')) {
        this.addPassed('CORS', 'CORS configurado en app.js');
      } else {
        this.addIssue('CORS', 'CORS no configurado en app.js');
      }
    }
  }

  checkDependencies() {
    console.log('\n🔍 Verificando Dependencias de Seguridad...');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const securityDeps = {
        'helmet': 'Headers de seguridad',
        'bcryptjs': 'Hashing de passwords',
        'jsonwebtoken': 'JWT tokens',
        'express-validator': 'Validación de input',
        'mongoose': 'ODM con sanitización'
      };

      for (const [dep, description] of Object.entries(securityDeps)) {
        if (dependencies[dep]) {
          this.addPassed('DEPS', `${dep} instalado (${description})`);
        } else {
          this.addWarning('DEPS', `${dep} no encontrado (${description})`);
        }
      }
    }
  }

  checkDatabaseSecurity() {
    console.log('\n🔍 Verificando Seguridad de Base de Datos...');

    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      if (mongoUri.includes('admin') && mongoUri.includes('password')) {
        this.addIssue('DB', 'Credenciales hardcodeadas en MONGODB_URI');
      } else if (mongoUri.includes('localhost') && process.env.NODE_ENV === 'production') {
        this.addWarning('DB', 'Usando localhost en producción');
      } else {
        this.addPassed('DB', 'MONGODB_URI configurado apropiadamente');
      }

      if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
        this.addPassed('DB', 'Credenciales de DB en variables separadas');
      }
    }
  }

  generateReport() {
    console.log('\n\n📊 REPORTE DE SEGURIDAD');
    console.log('========================\n');

    console.log(`✅ Verificaciones Pasadas: ${this.passed.length}`);
    console.log(`⚠️  Advertencias: ${this.warnings.length}`);
    console.log(`❌ Issues Críticos: ${this.issues.length}\n`);

    if (this.issues.length > 0) {
      console.log('❌ ISSUES CRÍTICOS (Deben resolverse antes de producción):');
      console.log('========================================================');
      this.issues.forEach(issue => {
        console.log(`   [${issue.severity}] ${issue.category}: ${issue.message}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  ADVERTENCIAS (Recomendado resolver):');
      console.log('=======================================');
      this.warnings.forEach(warning => {
        console.log(`   ${warning.category}: ${warning.message}`);
      });
      console.log('');
    }

    if (this.passed.length > 0) {
      console.log('✅ VERIFICACIONES EXITOSAS:');
      console.log('===========================');
      this.passed.forEach(pass => {
        console.log(`   ${pass.category}: ${pass.message}`);
      });
      console.log('');
    }

    // Resumen final
    const totalChecks = this.issues.length + this.warnings.length + this.passed.length;
    const score = Math.round((this.passed.length / totalChecks) * 100);

    console.log(`🎯 PUNTUACIÓN DE SEGURIDAD: ${score}%`);

    if (this.issues.length === 0 && this.warnings.length <= 2) {
      console.log('🎉 Sistema listo para producción!');
      return true;
    } else if (this.issues.length === 0) {
      console.log('🔶 Sistema casi listo - revisar advertencias');
      return true;
    } else {
      console.log('🚨 Sistema NO listo para producción - resolver issues críticos');
      return false;
    }
  }

  run() {
    console.log('🔒 VERIFICACIÓN DE SEGURIDAD DEL SISTEMA');
    console.log('=======================================');

    this.checkEnvironmentVariables();
    this.checkFilePermissions();
    this.checkSecurityHeaders();
    this.checkDependencies();
    this.checkDatabaseSecurity();

    return this.generateReport();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const checker = new SecurityChecker();
  const isReady = checker.run();
  process.exit(isReady ? 0 : 1);
}

module.exports = SecurityChecker;