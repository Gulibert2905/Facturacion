// src/components/layout/Layout.jsx
import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocalHospital as ServicesIcon,
  Description as ReportsIcon,
  CloudUpload as ImportIcon,
  ExitToApp as LogoutIcon,
  AssessmentOutlined as FinancialIcon,
  RuleOutlined as AuditIcon,
  FileUploadOutlined as RipsIcon,
  Business as BusinessIcon,
  MedicalServices,
  AttachMoney,
  InsertDriveFile as ContractIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Importar NotificationCenter y AuthContext
import NotificationCenter from '../notifications/NotificationCenter';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../services/authService';

// Ancho del drawer
const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userModules, setUserModules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, logout } = useAuth();

  // Cargar módulos del usuario desde la API
  React.useEffect(() => {
    const loadUserModules = async () => {
      if (!user) {
        // Solo limpiar módulos si no hay usuario autenticado
        setUserModules([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await authService.get('/role-permissions/my-permissions');
        if (response.success) {
          // Solo actualizar si hay datos válidos
          const newModules = response.data.modules || [];
          setUserModules(newModules);
        }
      } catch (error) {
        console.error('Error loading user modules:', error);
        // Mantener módulos existentes si hay un error temporal
        // Solo usar fallback si no hay módulos cargados previamente
        if (userModules.length === 0) {
          setUserModules(getStaticModulesForRole(user.role));
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserModules();
  }, [user]);

  // Fallback para módulos estáticos (compatibilidad)
  const getStaticModulesForRole = (role) => {
    const staticModules = {
      'superadmin': ['dashboard', 'services', 'advanced-dashboard', 'companies', 'contracts', 'cups', 'tariffs', 'reports', 'advanced-reports', 'import', 'financial', 'audit', 'rips', 'role-permissions'],
      'admin': ['dashboard', 'services', 'advanced-dashboard', 'companies', 'contracts', 'cups', 'tariffs', 'reports', 'advanced-reports', 'import', 'financial', 'audit', 'rips', 'role-permissions'],
      'facturador': ['dashboard', 'services', 'reports', 'rips'],
      'auditor': ['dashboard', 'advanced-dashboard', 'advanced-reports', 'financial', 'audit']
    };
    
    const allowedModuleIds = staticModules[role] || [];
    return menuItems.filter(item => !item.divider && allowedModuleIds.includes(item.moduleId));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { moduleId: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'superadmin', 'facturador', 'auditor'] },
    { moduleId: 'services', text: 'Servicios', icon: <ServicesIcon />, path: '/services', roles: ['admin', 'superadmin', 'facturador'] },
    { moduleId: 'advanced-dashboard', text: 'Dashboard Avanzado', icon: <AssessmentIcon />, path: '/advanced-dashboard', roles: ['admin', 'superadmin', 'auditor'] },
    // Configuración y catálogos - Solo admin y superadmin
    { divider: true, roles: ['admin', 'superadmin'] },
    { moduleId: 'companies', text: 'Empresas', icon: <BusinessIcon />, path: '/companies', roles: ['admin', 'superadmin'] },
    { moduleId: 'contracts', text: 'Contratos', icon: <ContractIcon />, path: '/contracts', roles: ['admin', 'superadmin'] },
    { moduleId: 'cups', text: 'Catálogo CUPS', icon: <MedicalServices />, path: '/cups', roles: ['admin', 'superadmin'] },
    { moduleId: 'tariffs', text: 'Tarifas por Contrato', icon: <AttachMoney />, path: '/tariffs', roles: ['admin', 'superadmin'] },
    // Operaciones
    { divider: true, roles: ['admin', 'superadmin', 'facturador', 'auditor'] },
    { moduleId: 'reports', text: 'Reportes', icon: <ReportsIcon />, path: '/reports', roles: ['admin', 'superadmin', 'facturador'] },
    { moduleId: 'advanced-reports', text: 'Reportes Avanzados', icon: <AssessmentIcon />, path: '/advanced-reports', roles: ['admin', 'superadmin', 'auditor'] },
    { moduleId: 'import', text: 'Importar Datos', icon: <ImportIcon />, path: '/import', roles: ['admin', 'superadmin'] },
    // Análisis
    { divider: true, roles: ['admin', 'superadmin', 'auditor'] },
    { moduleId: 'financial', text: 'Análisis Financiero', icon: <FinancialIcon />, path: '/financial', roles: ['admin', 'superadmin', 'auditor'] },
    { moduleId: 'audit', text: 'Auditoría', icon: <AuditIcon />, path: '/audit', roles: ['admin', 'superadmin', 'auditor'] },
    { moduleId: 'rips', text: 'Generador RIPS', icon: <RipsIcon />, path: '/rips', roles: ['admin', 'superadmin', 'facturador'] },
    { moduleId: 'role-permissions', text: 'Permisos de Roles', icon: <SecurityIcon />, path: '/role-permissions', roles: ['admin', 'superadmin'] },
    { moduleId: 'super-admin', text: 'Panel SuperAdmin', icon: <AssessmentIcon />, path: '/super-admin', roles: ['superadmin'] },
  ];

  // Función para convertir módulos de API a elementos de menú
  const getMenuItemsFromModules = () => {
    if (loading) return [];
    
    if (userModules.length === 0) {
      // Fallback a sistema estático
      return getStaticMenuItems();
    }

    // Crear mapa de módulos habilitados
    const enabledModuleIds = userModules
      .filter(module => module.enabled)
      .map(module => module.moduleId);

    // Filtrar elementos del menú basado en módulos habilitados
    const filtered = menuItems.filter(item => {
      if (item.divider) {
        // Para dividers, verificar si hay elementos después de él que son visibles
        const nextItems = menuItems.slice(menuItems.indexOf(item) + 1);
        return nextItems.some(nextItem => 
          !nextItem.divider && enabledModuleIds.includes(nextItem.moduleId)
        );
      }
      return enabledModuleIds.includes(item.moduleId);
    });

    // Limpiar dividers consecutivos
    return cleanupDividers(filtered);
  };

  // Función de limpieza de dividers
  const cleanupDividers = (items) => {
    const cleaned = [];
    let lastWasDivider = false;
    
    items.forEach((item, index) => {
      if (item.divider) {
        if (!lastWasDivider && cleaned.length > 0 && index < items.length - 1) {
          cleaned.push(item);
          lastWasDivider = true;
        }
      } else {
        cleaned.push(item);
        lastWasDivider = false;
      }
    });

    return cleaned;
  };

  // Función fallback para sistema estático
  const getStaticMenuItems = () => {
    if (!user || !user.role) return [];
    
    const filtered = menuItems.filter(item => {
      if (item.divider) {
        return !item.roles || item.roles.includes(user.role);
      }
      return item.roles && item.roles.includes(user.role);
    });

    return cleanupDividers(filtered);
  };

  const filteredMenuItems = getMenuItemsFromModules();

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Control de Facturación
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          ) : (
            <ListItem 
              button 
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          )
        ))}
      </List>
      <Divider />
      <List>
        <ListItem 
          button 
          onClick={logout}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItem>
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema de Control de Facturación
          </Typography>
          
          {/* Agregar NotificationCenter aquí */}
          <NotificationCenter />
          
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px' // Altura del AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;