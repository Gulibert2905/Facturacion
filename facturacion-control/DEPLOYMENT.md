# 🚀 Guía de Despliegue - Sistema de Control de Facturación

## 📋 Resumen de Preparación Completada

### ✅ Seguridad Implementada (100%)
- **Variables de entorno**: Configuradas y templateadas
- **Helmet.js**: Headers de seguridad activos
- **CORS estricto**: Solo orígenes autorizados
- **Rate limiting**: Configurado por variables de entorno
- **Input validation**: Express-validator implementado
- **Permisos de archivos**: .env y logs con permisos 600
- **JWT Security**: Secret de 64 bytes generado

### ✅ Archivos de Configuración Creados
- `backend/.env.template` - Template para nuevos entornos
- `backend/.env.production` - Configuración específica de producción
- `backend/SECURITY.md` - Documentación de seguridad
- `backend/scripts/security-check.js` - Verificación automática

## 🌟 Recomendaciones para Continuar

Dado que ya tienes una base sólida de seguridad, te sugiero seguir con:

### **Opción 1: Completar Funcionalidades Existentes** ⭐ *Recomendado*
Los logs muestran que hay endpoints que devuelven 404:
- `/api/api/financial/kpis` 
- `/api/api/audit/rules`

**Beneficio**: Completar el sistema antes de añadir complejidad adicional

### **Opción 2: Implementar Testing**
- Pruebas unitarias para controladores
- Pruebas de integración para APIs
- Pruebas end-to-end con Cypress

**Beneficio**: Confianza en el código antes de producción

### **Opción 3: Configurar Ambiente de Producción**
- Deploy en servidor real
- Configurar HTTPS/SSL
- Configurar base de datos MongoDB Atlas
- Implementar CI/CD

**Beneficio**: Sistema funcionando en producción

## 🔧 Guía Rápida de Deploy

### Paso 1: Preparar Servidor
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx mongodb-tools

# CentOS/RHEL
sudo yum install nodejs npm nginx
```

### Paso 2: Clonar y Configurar
```bash
git clone <tu-repositorio>
cd facturacion-control/backend
cp .env.production .env
# Editar .env con valores reales
npm install
```

### Paso 3: Verificar Seguridad
```bash
node scripts/security-check.js
# Debe mostrar: 🎉 Sistema listo para producción!
```

### Paso 4: Configurar Base de Datos
```bash
# Opción A: MongoDB Atlas (recomendado)
# - Crear cluster en https://cloud.mongodb.com
# - Obtener connection string
# - Actualizar MONGODB_URI en .env

# Opción B: MongoDB local
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Paso 5: Configurar Nginx (Reverse Proxy)
```nginx
# /etc/nginx/sites-available/facturacion
server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Paso 6: Configurar PM2 (Process Manager)
```bash
npm install -g pm2

# Backend
cd backend
pm2 start src/server.js --name facturacion-api

# Frontend (si es SPA)
cd ../frontend
npm run build
pm2 serve build 3000 --name facturacion-frontend

# Guardar configuración
pm2 save
pm2 startup
```

### Paso 7: SSL/TLS (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

### Paso 8: Verificar Deploy
```bash
# Verificar servicios
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# Probar APIs
curl https://tudominio.com/api/auth/health
```

## 📊 Monitoreo Post-Deploy

### Logs
```bash
# Aplicación
pm2 logs facturacion-api
tail -f backend/logs/combined.log

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistema
journalctl -u nginx -f
```

### Métricas Básicas
```bash
# CPU y memoria
htop

# Espacio en disco
df -h

# Conexiones de red
netstat -tulpn | grep :8080
```

## 🛠️ Comandos Útiles

### Backup de Base de Datos
```bash
mongodump --uri="mongodb://localhost:27017/facturacion" --out=/backup/$(date +%Y%m%d)
```

### Actualizar Aplicación
```bash
git pull origin main
npm install
node scripts/security-check.js
pm2 reload facturacion-api
```

### Verificar Seguridad
```bash
# SSL Test
curl -I https://tudominio.com

# Headers de Seguridad
curl -I https://tudominio.com/api/health

# Rate Limiting Test
for i in {1..10}; do curl https://tudominio.com/api/auth/login; done
```

## ❓ ¿Qué prefieres hacer ahora?

1. **Completar endpoints faltantes** (financial/kpis, audit/rules)
2. **Implementar testing completo**
3. **Proceder con deploy real**
4. **Agregar nuevas funcionalidades**

**Mi recomendación**: Completar los endpoints que faltan primero, ya que veo en los logs que el frontend los está intentando usar. Esto dará una experiencia más completa al usuario.

¿Con cuál te gustaría continuar?