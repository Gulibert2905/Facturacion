// src/pages/RolePermissions.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Alert,
  Chip,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as PreviewIcon,
  Person as PersonIcon,
  SupervisedUserCircle as AdminIcon,
  Work as WorkIcon,
  Assessment as AuditIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../components/services/authService';

const RolePermissions = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [roles, setRoles] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState(null);
  const { user } = useAuth();

  // Iconos para diferentes roles
  const roleIcons = {
    superadmin: <AdminIcon color="error" />,
    admin: <AdminIcon color="primary" />,
    facturador: <WorkIcon color="success" />,
    auditor: <AuditIcon color="warning" />,
    user: <PersonIcon color="disabled" />
  };

  // Colores para diferentes categorías de módulos
  const categoryColors = {
    dashboard: 'primary',
    operations: 'success',
    configuration: 'warning',
    reports: 'info',
    analysis: 'error'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesResponse, modulesResponse] = await Promise.all([
        authService.get('/role-permissions'),
        authService.get('/role-permissions/available-modules')
      ]);

      if (rolesResponse.success) {
        setRoles(rolesResponse.data);
      }

      if (modulesResponse.success) {
        setAvailableModules(modulesResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleModuleToggle = (roleIndex, moduleId) => {
    const newRoles = [...roles];
    const role = newRoles[roleIndex];
    
    const existingModuleIndex = role.modules.findIndex(m => m.moduleId === moduleId);
    
    if (existingModuleIndex >= 0) {
      // Toggle enabled status
      role.modules[existingModuleIndex].enabled = !role.modules[existingModuleIndex].enabled;
    } else {
      // Add new module
      const moduleTemplate = availableModules.find(m => m.moduleId === moduleId);
      if (moduleTemplate) {
        role.modules.push({
          ...moduleTemplate,
          enabled: true
        });
      }
    }
    
    setRoles(newRoles);
  };

  const isModuleEnabled = (role, moduleId) => {
    const module = role.modules.find(m => m.moduleId === moduleId);
    return module ? module.enabled : false;
  };

  const saveRolePermissions = async (role) => {
    try {
      setSaving(true);
      const response = await authService.put(`/role-permissions/${role.roleName}`, {
        modules: role.modules,
        description: role.description
      });

      if (response.success) {
        showMessage(`Permisos actualizados para ${role.roleDisplayName}`, 'success');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      showMessage('Error guardando permisos', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getModulesByCategory = () => {
    const categories = {};
    availableModules.forEach(module => {
      const category = module.category || 'others';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(module);
    });
    return categories;
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      dashboard: 'Tableros',
      operations: 'Operaciones',
      configuration: 'Configuración',
      reports: 'Reportes',
      analysis: 'Análisis',
      others: 'Otros'
    };
    return names[category] || category;
  };

  const getEnabledModulesCount = (role) => {
    return role.modules.filter(m => m.enabled).length;
  };

  const handlePreview = (role) => {
    setPreviewRole(role);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Cargando permisos de roles...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SecurityIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <div>
            <Typography variant="h4" component="h1">
              Gestión de Permisos por Roles
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Configura qué módulos puede ver cada rol del sistema
            </Typography>
          </div>
          <Box flexGrow={1} />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>

        {message && (
          <Alert severity={messageType} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
          >
            {roles.map((role, index) => (
              <Tab
                key={role.roleName}
                label={
                  <Box display="flex" alignItems="center">
                    {roleIcons[role.roleName]}
                    <Box ml={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {role.roleDisplayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getEnabledModulesCount(role)} módulos
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {roles.map((role, roleIndex) => (
          <div key={role.roleName} hidden={currentTab !== roleIndex}>
            <Card elevation={1} sx={{ mb: 3 }}>
              <CardHeader
                avatar={roleIcons[role.roleName]}
                title={role.roleDisplayName}
                subheader={role.description}
                action={
                  <Box>
                    <Tooltip title="Vista previa del menú">
                      <IconButton onClick={() => handlePreview(role)}>
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => saveRolePermissions(role)}
                      disabled={saving}
                      sx={{ ml: 1 }}
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  {Object.entries(getModulesByCategory()).map(([category, modules]) => (
                    <Grid item xs={12} md={6} key={category}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Chip
                            label={getCategoryDisplayName(category)}
                            color={categoryColors[category] || 'default'}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({modules.filter(m => isModuleEnabled(role, m.moduleId)).length}/{modules.length})
                          </Typography>
                        </Box>
                        <FormGroup>
                          {modules.map((module) => (
                            <FormControlLabel
                              key={module.moduleId}
                              control={
                                <Checkbox
                                  checked={isModuleEnabled(role, module.moduleId)}
                                  onChange={() => handleModuleToggle(roleIndex, module.moduleId)}
                                  name={module.moduleId}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {module.moduleName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {module.path}
                                  </Typography>
                                </Box>
                              }
                            />
                          ))}
                        </FormGroup>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </div>
        ))}
      </Paper>

      {/* Dialog de vista previa */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Vista Previa del Menú - {previewRole?.roleDisplayName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Módulos visibles para este rol:
          </Typography>
          <Box sx={{ mt: 2 }}>
            {previewRole?.modules
              .filter(m => m.enabled)
              .map((module, index) => (
                <Box key={module.moduleId} sx={{ mb: 1 }}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mr: 2
                      }}
                    />
                    <Typography variant="body2">
                      {module.moduleName}
                    </Typography>
                  </Box>
                  {index < previewRole.modules.filter(m => m.enabled).length - 1 && (
                    <Divider sx={{ my: 0.5, ml: 3 }} />
                  )}
                </Box>
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RolePermissions;