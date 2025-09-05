# Multi-stage build para el frontend
FROM node:18-alpine as build

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --silent

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Etapa de producción con nginx
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Nginx se ejecuta automáticamente
CMD ["nginx", "-g", "daemon off;"]