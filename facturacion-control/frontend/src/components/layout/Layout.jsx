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
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Importar NotificationCenter
import NotificationCenter from '../notifications/NotificationCenter';

// Ancho del drawer
const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Servicios', icon: <ServicesIcon />, path: '/services' },
    { text: 'Dashboard Avanzado', icon: <AssessmentIcon />, path: '/advanced-dashboard' },
    // Configuración y catálogos
    { divider: true },
    { text: 'Empresas', icon: <BusinessIcon />, path: '/companies' },
    { text: 'Contratos', icon: <ContractIcon />, path: '/contracts' },
    { text: 'Catálogo CUPS', icon: <MedicalServices />, path: '/cups' },
    { text: 'Tarifas por Contrato', icon: <AttachMoney />, path: '/tariffs' },
    // Operaciones
    { divider: true },
    { text: 'Reportes', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Reportes Avanzados', icon: <AssessmentIcon />, path: '/advanced-reports' },
    { text: 'Importar Datos', icon: <ImportIcon />, path: '/import' },
    // Análisis
    { divider: true },
    { text: 'Análisis Financiero', icon: <FinancialIcon />, path: '/financial' },
    { text: 'Auditoría', icon: <AuditIcon />, path: '/audit' },
    { text: 'Generador RIPS', icon: <RipsIcon />, path: '/rips' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Control de Facturación
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
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
          onClick={() => navigate('/login')}
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