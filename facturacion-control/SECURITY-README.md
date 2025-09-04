# 🔐 GUÍA DE SEGURIDAD PARA PRODUCCIÓN
## Sistema de Facturación v3.0.0

---

## 🚨 **CONFIGURACIÓN CRÍTICA ANTES DEL DEPLOYMENT**

### **1. Variables de Entorno Obligatorias**

```bash
# Copiar archivo de ejemplo
cp backend/.env.production.example backend/.env.production

# CONFIGURAR LAS SIGUIENTES VARIABLES CRÍTICAS:
```

#### **🔑 Seguridad de Autenticación**
```bash
# Generar nuevo JWT secret (obligatorio)
JWT_SECRET=CAMBIAR_POR_TOKEN_GENERADO_AUTOMATICAMENTE

# Configurar MongoDB con autenticación
MONGODB_URI=mongodb://facturacion_user:PASSWORD_SEGURO@localhost:27017/facturacion?authSource=admin
MONGODB_USER=facturacion_user  
MONGODB_PASSWORD=PASSWORD_MUY_SEGURO_AQUI
```

#### **🌐 Configuración de Red**
```bash
# Dominios permitidos (CORS)
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com,https://app.tu-dominio.com
FRONTEND_URL=https://tu-dominio.com

# SSL/HTTPS (recomendado)
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/tu-dominio.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/tu-dominio.com/privkey.pem
```

#### **🛡️ Rate Limiting (Producción)**
```bash
RATE_LIMIT_WINDOW_MS=900000          # 15 minutos
RATE_LIMIT_MAX_REQUESTS=50           # 50 requests por IP
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=3      # 3 intentos de login
```

---

## 🗄️ **CONFIGURACIÓN DE MONGODB**

### **Paso 1: Ejecutar Script de Configuración**
```bash
cd backend
node scripts/setup-mongodb-auth.js
```

### **Paso 2: Habilitar Autenticación en MongoDB**
```bash
# Editar configuración de MongoDB
sudo nano /etc/mongod.conf

# Agregar:
security:
  authorization: enabled

# Reiniciar MongoDB
sudo systemctl restart mongod
```

### **Paso 3: Crear Usuarios de Base de Datos**
```javascript
// Conectar como admin
mongo admin

// Crear usuario administrador
db.createUser({
  user: "admin",
  pwd: "PASSWORD_ADMIN_MUY_SEGURO",
  roles: ["root"]
});

// Crear usuario para la aplicación
db.createUser({
  user: "facturacion_user", 
  pwd: "PASSWORD_APP_MUY_SEGURO",
  roles: [{ role: "readWrite", db: "facturacion" }]
});
```

---

## 🔒 **CONFIGURACIÓN SSL/HTTPS**

### **Opción 1: Let's Encrypt (Recomendado)**
```bash
# Instalar Certbot
sudo apt update
sudo apt install snapd
sudo snap install --classic certbot

# Generar certificados
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Opción 2: Certificados Propios**
```bash
# Variables de entorno para SSL
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
SSL_CA_PATH=/path/to/ca-bundle.crt  # Opcional
```

---

## 🚀 **DEPLOYMENT**

### **Paso 1: Ejecutar Script de Deployment**
```bash
cd backend
./scripts/deploy-production.sh
```

### **Paso 2: Configurar Variables**
```bash
# Editar archivo de producción
nano .env.production

# ⚠️ CAMBIAR OBLIGATORIAMENTE:
# - JWT_SECRET
# - MONGODB_PASSWORD  
# - ALLOWED_ORIGINS
# - SSL certificates (si aplica)
```

### **Paso 3: Iniciar con PM2**
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Verificar estado
pm2 status
pm2 monit

# Ver logs
pm2 logs facturacion-api
```

---

## 🔍 **VERIFICACIÓN POST-DEPLOYMENT**

### **✅ Checklist de Seguridad**

- [ ] **JWT_SECRET** cambiado del valor por defecto
- [ ] **MongoDB** con autenticación habilitada
- [ ] **CORS** configurado para dominios específicos  
- [ ] **Rate Limiting** activado
- [ ] **HTTPS** funcionando (si aplica)
- [ ] **Logs** rotando correctamente
- [ ] **Firewall** configurado
- [ ] **Backups** automáticos funcionando

### **🧪 Tests de Seguridad**
```bash
# Test de rate limiting
for i in {1..60}; do curl http://tu-dominio.com/api/dashboard; done

# Test CORS
curl -H "Origin: http://sitio-malicioso.com" http://tu-dominio.com/api/dashboard

# Test HTTPS redirect
curl -I http://tu-dominio.com/api/dashboard
```

---

## 📊 **MONITOREO Y LOGS**

### **Ubicación de Logs**
```bash
/var/log/facturacion/     # Logs de aplicación
/var/log/pm2/            # Logs de PM2
logs/audit.log           # Eventos de seguridad
```

### **Monitoreo con PM2**
```bash
pm2 monit                # Dashboard en tiempo real
pm2 logs --lines 100     # Últimos 100 logs
pm2 show facturacion-api # Detalles de la aplicación
```

---

## 🚨 **INCIDENTES Y RESPUESTA**

### **Alertas Críticas a Monitorear**
- **Rate limiting excedido** → Posible ataque DDoS
- **Intentos de login masivos** → Posible brute force
- **Requests a endpoints inexistentes** → Scanning/reconnaissance
- **CORS violations repetidas** → Ataques cross-origin

### **Comandos de Emergencia**
```bash
# Parar aplicación inmediatamente
pm2 stop facturacion-api

# Ver últimos errores críticos
tail -f logs/error.log | grep -i "critical\|error"

# Bloquear IP específica (temporal)
sudo ufw insert 1 deny from MALICIOUS_IP
```

---

## 📋 **MANTENIMIENTO REGULAR**

### **Diario**
- Revisar logs de errores
- Verificar uso de CPU/memoria
- Comprobar disponibilidad del servicio

### **Semanal**  
- Revisar logs de seguridad
- Actualizar dependencias críticas
- Verificar backups

### **Mensual**
- Rotar logs antiguos
- Revisar usuarios y permisos
- Audit de seguridad completo
- Actualizar certificados SSL

---

## 📞 **CONTACTO Y SOPORTE**

Para incidencias críticas de seguridad:
1. **Inmediato**: Parar servicio si es necesario
2. **Documentar**: Capturar logs relevantes  
3. **Reportar**: Notificar al equipo técnico
4. **Remediar**: Aplicar parches/actualizaciones

---

⚠️ **IMPORTANTE**: Esta configuración implementa las mejores prácticas de seguridad para entornos de producción. NO omitir ningún paso crítico marcado como obligatorio.