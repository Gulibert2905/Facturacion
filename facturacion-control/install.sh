#!/bin/bash

# Script de instalación automática del Sistema de Facturación
# Compatible con Ubuntu/Debian y CentOS/RHEL

set -e

echo "🚀 Iniciando instalación del Sistema de Facturación..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detectar sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            print_status "Sistema detectado: Debian/Ubuntu"
        elif [ -f /etc/redhat-release ]; then
            OS="rhel"
            print_status "Sistema detectado: CentOS/RHEL/Fedora"
        else
            print_error "Distribución de Linux no soportada"
            exit 1
        fi
    else
        print_error "Sistema operativo no soportado. Solo Linux es compatible."
        exit 1
    fi
}

# Instalar Docker
install_docker() {
    print_status "Instalando Docker..."
    
    if command -v docker &> /dev/null; then
        print_warning "Docker ya está instalado"
        return
    fi

    if [ "$OS" = "debian" ]; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg lsb-release
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif [ "$OS" = "rhel" ]; then
        # CentOS/RHEL
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl start docker
    fi

    # Añadir usuario actual al grupo docker
    sudo usermod -aG docker $USER
    
    print_status "Docker instalado correctamente"
}

# Instalar Docker Compose (versión standalone si es necesaria)
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose ya está instalado"
        return
    fi

    print_status "Instalando Docker Compose..."
    
    # Instalar docker-compose standalone
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose instalado correctamente"
}

# Verificar puertos disponibles
check_ports() {
    print_status "Verificando puertos disponibles..."
    
    PORTS=(80 5000 27017)
    for port in "${PORTS[@]}"; do
        if ss -tuln | grep -q ":$port "; then
            print_error "Puerto $port ya está en uso. Por favor libéralo antes de continuar."
            print_status "Para ver qué proceso usa el puerto: sudo lsof -i :$port"
            exit 1
        fi
    done
    
    print_status "Todos los puertos necesarios están disponibles"
}

# Configurar variables de entorno
setup_env() {
    print_status "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Archivo .env creado desde .env.example"
        
        # Generar JWT secret aleatorio
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "fallback-secret-key-$(date +%s)")
        sed -i "s/your-super-secure-jwt-secret-key-here-change-this-in-production/$JWT_SECRET/" .env
        
        print_status "Variables de entorno configuradas automáticamente"
    else
        print_warning "El archivo .env ya existe, no se modificará"
    fi
}

# Iniciar servicios
start_services() {
    print_status "Iniciando servicios Docker..."
    
    # Construir y iniciar contenedores
    docker-compose up -d --build
    
    print_status "Esperando que los servicios estén listos..."
    sleep 30
    
    # Verificar que los servicios están corriendo
    if docker-compose ps | grep -q "Up"; then
        print_status "✅ Servicios iniciados correctamente"
    else
        print_error "❌ Error al iniciar algunos servicios"
        docker-compose logs
        exit 1
    fi
}

# Verificar instalación
verify_installation() {
    print_status "Verificando instalación..."
    
    # Verificar backend
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "✅ Backend funcionando correctamente"
    else
        print_warning "⚠️  Backend no responde en el puerto 5000"
    fi
    
    # Verificar frontend
    if curl -s http://localhost > /dev/null 2>&1; then
        print_status "✅ Frontend funcionando correctamente"
    else
        print_warning "⚠️  Frontend no responde en el puerto 80"
    fi
    
    # Verificar MongoDB
    if docker exec facturacion-db mongo --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        print_status "✅ Base de datos funcionando correctamente"
    else
        print_warning "⚠️  Base de datos no responde"
    fi
}

# Mostrar información final
show_final_info() {
    echo ""
    echo -e "${GREEN}🎉 ¡Instalación completada!${NC}"
    echo ""
    echo -e "${BLUE}📱 Accesos a la aplicación:${NC}"
    echo "   • Frontend: http://localhost"
    echo "   • Backend API: http://localhost:5000"
    echo "   • Base de datos: localhost:27017"
    echo ""
    echo -e "${BLUE}🔑 Credenciales iniciales:${NC}"
    echo "   • Usuario: admin"
    echo "   • Contraseña: Admin123!"
    echo ""
    echo -e "${BLUE}📋 Comandos útiles:${NC}"
    echo "   • Ver logs: docker-compose logs -f"
    echo "   • Reiniciar: docker-compose restart"
    echo "   • Detener: docker-compose down"
    echo "   • Actualizar: git pull && docker-compose up -d --build"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   • Cambia las credenciales por defecto en producción"
    echo "   • Configura HTTPS para uso en producción"
    echo "   • Haz backups regulares de la base de datos"
    echo ""
    echo -e "${GREEN}¡El sistema está listo para usar!${NC}"
}

# Script principal
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║     Sistema de Facturación v1.0      ║"
    echo "║         Instalador Automático        ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    detect_os
    install_docker
    install_docker_compose
    check_ports
    setup_env
    start_services
    sleep 10  # Dar tiempo a que los servicios se inicialicen
    verify_installation
    show_final_info
}

# Verificar si se está ejecutando con permisos de sudo cuando es necesario
if [ "$EUID" -eq 0 ]; then
    print_warning "No ejecutes este script como root. Se pedirán permisos sudo cuando sea necesario."
    exit 1
fi

# Verificar si estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto (donde está docker-compose.yml)"
    exit 1
fi

# Ejecutar script principal
main "$@"