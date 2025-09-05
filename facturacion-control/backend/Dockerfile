# Dockerfile para el backend
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar permisos del directorio
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 5000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]