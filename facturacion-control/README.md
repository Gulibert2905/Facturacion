# Sistema de Facturación

Sistema completo de gestión de facturación médica con generación de RIPS, manejo de usuarios, empresas, contratos y reportes avanzados.

## 🚀 Despliegue con Docker

Este proyecto está completamente containerizado y listo para ejecutar en cualquier máquina con Docker.

### Prerrequisitos

- Docker (versión 20.10+)
- Docker Compose (versión 2.0+)
- Al menos 2GB de RAM disponible
- Puertos 80, 5000 y 27017 disponibles

### Instalación Rápida

1. **Clonar el repositorio:**
```bash
git clone [URL_DEL_REPO]
cd facturacion-control
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones específicas
```

3. **Iniciar todos los servicios:**
```bash
docker-compose up -d
```

4. **Acceder a la aplicación:**
- Frontend: http://localhost
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Credenciales Iniciales

- **Usuario:** admin
- **Contraseña:** Admin123!

## 🛠️ Comandos Útiles

### Producción
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar un servicio específico
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: elimina la base de datos)
docker-compose down -v
```

### Desarrollo
```bash
# Usar configuración de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Ejecutar solo la base de datos para desarrollo local
docker-compose -f docker-compose.dev.yml up -d mongodb
```

### Base de Datos

```bash
# Hacer backup de la base de datos
docker exec facturacion-db mongodump --uri="mongodb://admin:facturacion123@localhost:27017/facturacion?authSource=admin" --out=/backup

# Restaurar base de datos
docker exec facturacion-db mongorestore --uri="mongodb://admin:facturacion123@localhost:27017/facturacion?authSource=admin" /backup/facturacion
```

## 📁 Estructura del Proyecto

```
facturacion-control/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── models/        # Modelos de Mongoose
│   │   ├── routes/        # Definición de rutas
│   │   ├── middleware/    # Middleware personalizado
│   │   └── utils/         # Utilidades
│   ├── Dockerfile         # Imagen para producción
│   └── Dockerfile.dev     # Imagen para desarrollo
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── contexts/      # Context providers
│   │   └── utils/         # Utilidades del frontend
│   ├── Dockerfile         # Imagen para producción
│   └── nginx.conf         # Configuración de Nginx
├── mongodb-init/          # Scripts de inicialización de DB
├── docker-compose.yml     # Configuración de producción
├── docker-compose.dev.yml # Configuración de desarrollo
└── README.md             # Este archivo
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Base de datos
MONGODB_URI=mongodb://admin:facturacion123@mongodb:27017/facturacion?authSource=admin
MONGODB_USER=admin
MONGODB_PASSWORD=facturacion123

# JWT
JWT_SECRET=tu-clave-secreta-super-segura
JWT_EXPIRE=30d

# Servidor
NODE_ENV=production
PORT=5000
```

### Personalización de Puertos

Para cambiar los puertos, edita `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Cambiar puerto del frontend
  backend:
    ports:
      - "3001:5000"  # Cambiar puerto del backend
```

### Volúmenes Persistentes

Los datos se almacenan en volúmenes de Docker:
- `mongodb_data`: Base de datos MongoDB
- `./backend/logs`: Logs del backend

## 🚨 Solución de Problemas

### Error: Puerto ya en uso
```bash
# Verificar qué proceso usa el puerto
netstat -tulpn | grep :80
# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### Error: Sin memoria suficiente
```bash
# Verificar uso de memoria
docker stats
# Aumentar memoria disponible para Docker
```

### Problemas de permisos
```bash
# Reconstruir imágenes sin cache
docker-compose build --no-cache
docker-compose up -d
```

### Resetear base de datos
```bash
# CUIDADO: Esto elimina todos los datos
docker-compose down -v
docker-compose up -d
```

## 📊 Monitoreo

### Logs de la aplicación
```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Seguir logs en tiempo real
docker-compose logs -f
```

### Estado de los contenedores
```bash
# Ver estado de los servicios
docker-compose ps

# Ver uso de recursos
docker stats
```

## 🔒 Seguridad

### En Producción

1. **Cambiar credenciales por defecto:**
   - Actualizar contraseñas en `.env`
   - Cambiar `JWT_SECRET` por algo único y seguro
   - Crear nuevos usuarios y eliminar el admin por defecto

2. **Configurar HTTPS:**
   - Usar un proxy reverso como Nginx o Traefik
   - Configurar certificados SSL

3. **Firewall:**
   - Exponer solo los puertos necesarios
   - Usar reglas de firewall restrictivas

## 📈 Escalabilidad

Para mayor carga de trabajo:

1. **Base de datos:**
   - Configurar replica set de MongoDB
   - Usar MongoDB Atlas para producción

2. **Backend:**
   - Escalar horizontalmente con múltiples instancias
   - Usar load balancer

3. **Frontend:**
   - Usar CDN para archivos estáticos
   - Implementar caché de navegador

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para tu feature
3. Commit de cambios
4. Push a la rama
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

## 📞 Soporte

Para problemas o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**¡Listo para usar!** 🎉

El sistema estará disponible en http://localhost una vez ejecutado `docker-compose up -d`