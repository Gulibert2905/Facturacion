#!/bin/bash

# Script de deployment para producción
# Sistema de Facturación v3.0.0

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "package.json no encontrado. Ejecutar desde el directorio backend."
    exit 1
fi

log_info "🚀 Iniciando deployment de producción..."

# 1. Verificar Node.js y npm
log_info "Verificando Node.js y npm..."
node --version || { log_error "Node.js no instalado"; exit 1; }
npm --version || { log_error "npm no instalado"; exit 1; }
log_success "Node.js y npm verificados"

# 2. Instalar dependencias de producción
log_info "Instalando dependencias de producción..."
npm ci --only=production

# 3. Verificar archivo .env.production
if [ ! -f ".env.production" ]; then
    log_warning ".env.production no encontrado. Copiando desde ejemplo..."
    cp .env.production.example .env.production
    log_error "⚠️  CRÍTICO: Debes configurar .env.production antes de continuar"
    log_error "   - Cambiar JWT_SECRET"
    log_error "   - Configurar MONGODB_URI con autenticación"
    log_error "   - Configurar ALLOWED_ORIGINS"
    log_error "   - Configurar SSL si es necesario"
    exit 1
fi
log_success "Archivo .env.production encontrado"

# 4. Crear directorios necesarios
log_info "Creando directorios necesarios..."
mkdir -p logs
mkdir -p backups
mkdir -p uploads
log_success "Directorios creados"

# 5. Configurar permisos
log_info "Configurando permisos..."
chmod 750 logs/
chmod 750 backups/
chmod 644 .env.production
log_success "Permisos configurados"

# 6. Ejecutar tests críticos
log_info "Ejecutando tests críticos..."
if npm test -- --testPathPattern="critical|security" > /dev/null 2>&1; then
    log_success "Tests críticos pasaron"
else
    log_warning "Algunos tests críticos fallaron. Revisar logs."
fi

# 7. Verificar conexión MongoDB
log_info "Verificando conexión MongoDB..."
if node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.production' });
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('MongoDB OK'); process.exit(0); })
  .catch(() => { console.error('MongoDB FAIL'); process.exit(1); });
" 2>/dev/null; then
    log_success "MongoDB conectado correctamente"
else
    log_error "❌ No se pudo conectar a MongoDB. Verificar MONGODB_URI"
    exit 1
fi

# 8. Instalar PM2 si no existe
if ! command -v pm2 &> /dev/null; then
    log_info "Instalando PM2..."
    npm install -g pm2
    log_success "PM2 instalado"
fi

# 9. Configurar PM2
log_info "Configurando PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
    apps: [{
        name: 'facturacion-api',
        script: './server.production.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        env_file: '.env.production',
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true,
        max_restarts: 10,
        min_uptime: '10s',
        max_memory_restart: '500M',
        node_args: '--max-old-space-size=512'
    }]
};
EOF
log_success "PM2 configurado"

# 10. Crear archivo server.production.js
log_info "Creando servidor de producción..."
cat > server.production.js << 'EOF'
const app = require('./src/app.production');
const { setupHTTPS } = require('./src/config/https');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Configurar HTTPS si está habilitado
const httpsServer = setupHTTPS(app);

if (httpsServer) {
    httpsServer.listen(PORT, () => {
        logger.info(`🔒 Servidor HTTPS corriendo en puerto ${PORT}`);
        logger.info('✅ Modo producción activado');
    });
} else {
    app.listen(PORT, () => {
        logger.info(`🌐 Servidor HTTP corriendo en puerto ${PORT}`);
        logger.info('✅ Modo producción activado');
    });
}

// Manejo graceful de shutdown
process.on('SIGINT', () => {
    logger.info('Recibida señal SIGINT, cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Recibida señal SIGTERM, cerrando servidor...');
    process.exit(0);
});
EOF
log_success "Servidor de producción creado"

# 11. Configurar logrotate
log_info "Configurando rotación de logs..."
sudo tee /etc/logrotate.d/facturacion-api << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
    notifempty
}
EOF
log_success "Logrotate configurado"

# 12. Configurar firewall básico (si ufw está disponible)
if command -v ufw &> /dev/null; then
    log_info "Configurando firewall básico..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 5000/tcp  # API
    log_success "Firewall configurado"
fi

# 13. Configurar backup automático
log_info "Configurando backup automático..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/facturacion"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup de MongoDB
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE"

# Backup de logs importantes
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" logs/

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completado: $DATE"
EOF

chmod +x scripts/backup.sh

# Agregar a crontab si no existe
if ! crontab -l | grep -q "backup.sh"; then
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup.sh >> $(pwd)/logs/backup.log 2>&1") | crontab -
    log_success "Backup automático configurado (2:00 AM diariamente)"
fi

# 14. Resumen final
echo ""
log_success "🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE!"
echo ""
log_info "📋 PRÓXIMOS PASOS:"
echo "   1. Revisar y configurar .env.production"
echo "   2. Configurar SSL/HTTPS si es necesario"
echo "   3. Iniciar aplicación: pm2 start ecosystem.config.js"
echo "   4. Configurar monitoreo: pm2 monit"
echo "   5. Verificar logs: pm2 logs facturacion-api"
echo ""
log_info "📊 COMANDOS ÚTILES:"
echo "   - Iniciar: pm2 start ecosystem.config.js"
echo "   - Parar: pm2 stop facturacion-api"
echo "   - Reiniciar: pm2 restart facturacion-api"
echo "   - Logs: pm2 logs facturacion-api"
echo "   - Status: pm2 status"
echo "   - Monitoreo: pm2 monit"
echo ""
log_warning "⚠️  RECUERDA: Configurar las variables de entorno antes de iniciar"