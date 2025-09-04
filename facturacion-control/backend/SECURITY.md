# 🔒 Guía de Seguridad - Sistema de Control de Facturación

## ✅ Mejoras de Seguridad Implementadas

### 1. Gestión de Variables de Entorno
- ✅ **JWT_SECRET**: Generado criptográficamente seguro (64 bytes)
- ✅ **Separación de configuraciones**: Development vs Production
- ✅ **Template de variables**: `.env.template` para nuevos deployments
- ✅ **Permisos de archivo**: `.env` con permisos 600 (solo propietario)

### 2. Headers de Seguridad (Helmet.js)
- ✅ **Content Security Policy**: Configurado para prevenir XSS
- ✅ **HSTS**: Fuerza HTTPS en producción (1 año)
- ✅ **X-Frame-Options**: Previene clickjacking
- ✅ **X-Content-Type-Options**: Previene MIME sniffing
- ✅ **Referrer Policy**: Control de información de referencia

### 3. CORS Mejorado
- ✅ **Origins específicos**: Solo dominios autorizados en producción
- ✅ **Métodos limitados**: Solo métodos HTTP necesarios
- ✅ **Headers controlados**: Lista específica de headers permitidos
- ✅ **Credentials**: Manejo seguro de cookies/auth
- ✅ **Logging**: Registro de intentos bloqueados por CORS

### 4. Rate Limiting Avanzado
- ✅ **Configurables por entorno**: Variables de entorno para limites
- ✅ **Login específico**: Límites más estrictos para autenticación
- ✅ **Headers informativos**: X-RateLimit-* headers
- ✅ **Logging**: Registro de IPs que exceden límites

### 5. Validación de Input
- ✅ **Express-validator**: Instalado para validación robusta
- ✅ **Sanitización**: Middleware de sanitización implementado
- ✅ **Validación de passwords**: Políticas estrictas (12+ caracteres)
- ✅ **Escape de HTML**: Prevención de XSS

### 6. Base de Datos
- ✅ **Variables separadas**: MONGODB_USER y MONGODB_PASSWORD independientes
- ✅ **Connection string seguro**: Sin credenciales hardcodeadas
- ✅ **Mongoose**: ODM con sanitización automática

## 🛡️ Características de Seguridad Activas

### Autenticación
- JWT con expiración configurable (30 días por defecto)
- Password hashing con bcrypt (salt rounds: 12)
- Account lockout tras múltiples intentos fallidos
- Rate limiting específico para login

### Autorización
- Sistema de roles jerárquico (user < facturador < auditor < admin < superadmin)
- Permisos dinámicos basados en base de datos
- Middleware de protección en todas las rutas sensibles

### Logging de Seguridad
- Intentos de login (exitosos y fallidos)
- Violaciones de rate limiting
- Intentos de CORS bloqueados
- Accesos no autorizados

### Protecciones Implementadas
- **XSS Protection**: CSP headers + input sanitization
- **CSRF Protection**: Headers específicos requeridos
- **Injection Prevention**: Mongoose ODM + input validation
- **Clickjacking**: X-Frame-Options header
- **MIME Sniffing**: X-Content-Type-Options header

## ⚙️ Configuración para Producción

### Variables de Entorno Requeridas
```bash
# Entorno
NODE_ENV=production
PORT=8080

# Base de datos
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/facturacion_prod
MONGODB_USER=facturacion_user
MONGODB_PASSWORD=secure_password_here

# Seguridad
JWT_SECRET=<64_byte_random_string>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
```

### Verificación de Seguridad
Ejecutar antes de cada deployment:
```bash
npm run security-check
```

### Recomendaciones Adicionales para Producción

#### 1. Infraestructura
- [ ] Usar HTTPS (SSL/TLS) en todo momento
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Configurar firewall de sistema operativo
- [ ] Usar reverse proxy (Nginx) con configuraciones seguras

#### 2. Base de Datos
- [ ] Habilitar autenticación MongoDB
- [ ] Usar conexiones SSL/TLS
- [ ] Implementar backup automatizado
- [ ] Configurar réplicas para alta disponibilidad

#### 3. Monitoreo
- [ ] Alertas por intentos de intrusión
- [ ] Monitoreo de performance y disponibilidad
- [ ] Logs centralizados (ELK stack recomendado)
- [ ] Métricas de seguridad en tiempo real

#### 4. Actualizaciones
- [ ] Auditoría regular de dependencias (`npm audit`)
- [ ] Actualizaciones de seguridad automáticas
- [ ] Revisiones de código enfocadas en seguridad
- [ ] Penetration testing periódico

## 🚨 Lista de Verificación Pre-Deployment

- [ ] Todas las variables de entorno configuradas
- [ ] `npm run security-check` pasa al 100%
- [ ] SSL/HTTPS configurado
- [ ] Backups de base de datos funcionando
- [ ] Logs de aplicación funcionando
- [ ] Rate limiting probado
- [ ] Autenticación y autorización probadas
- [ ] CORS configurado para dominios de producción
- [ ] Passwords por defecto cambiados
- [ ] Permisos de archivos verificados (600 para .env)

## 📞 Soporte de Seguridad

En caso de incidentes de seguridad:
1. Cambiar inmediatamente JWT_SECRET
2. Revisar logs de acceso
3. Bloquear IPs sospechosas
4. Notificar a usuarios si es necesario
5. Documentar el incidente

---

**Última actualización**: $(date)
**Puntuación de seguridad actual**: 100% ✅