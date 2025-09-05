// src/pages/SuperAdminPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import {
  SupervisedUserCircle as SuperAdminIcon,
  PersonAdd as AddUserIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Assessment as StatsIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../components/services/authService';

const SuperAdminPanel = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'facturador'
  });
  const { user } = useAuth();

  const roleColors = {
    superadmin: 'error',
    admin: 'primary', 
    facturador: 'success',
    auditor: 'warning',
    user: 'default'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        authService.get('/users'),
        authService.get('/role-permissions')
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }

      if (rolesResponse.success) {
        setRoles(rolesResponse.data || []);
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

  const handleCreateUser = async () => {
    try {
      if (!newUser.username || !newUser.password || !newUser.fullName || !newUser.email) {
        showMessage('Todos los campos son requeridos', 'error');
        return;
      }

      const response = await authService.post('/users', newUser);

      if (response.success) {
        showMessage('Usuario creado exitosamente', 'success');
        setOpenCreateUser(false);
        setNewUser({
          username: '',
          email: '',
          fullName: '',
          password: '',
          role: 'facturador'
        });
        loadData();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage('Error creando usuario', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      const response = await authService.delete(`/users/${userId}`);

      if (response.success) {
        showMessage('Usuario eliminado exitosamente', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Error eliminando usuario', 'error');
    }
  };

  const getStats = () => {
    const stats = {
      total: users.length,
      superadmins: users.filter(u => u.role === 'superadmin').length,
      admins: users.filter(u => u.role === 'admin').length,
      facturadores: users.filter(u => u.role === 'facturador').length,
      auditores: users.filter(u => u.role === 'auditor').length,
      active: users.filter(u => u.active).length,
      inactive: users.filter(u => !u.active).length
    };
    return stats;
  };

  const stats = getStats();

  return (
    <Container maxWidth="xl">
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SuperAdminIcon sx={{ fontSize: 40, mr: 2, color: 'error.main' }} />
          <div>
            <Typography variant="h4" component="h1">
              Panel de Super Administrador
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestión completa de usuarios, roles y sistema
            </Typography>
          </div>
          <Box flexGrow={1} />
          <Button
            variant="contained"
            startIcon={<AddUserIcon />}
            onClick={() => setOpenCreateUser(true)}
          >
            Crear Usuario
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
          >
            <Tab icon={<GroupIcon />} label="Gestión de Usuarios" />
            <Tab icon={<SecurityIcon />} label="Permisos de Roles" />
            <Tab icon={<StatsIcon />} label="Estadísticas" />
            <Tab icon={<SettingsIcon />} label="Configuración Sistema" />
          </Tabs>
        </Box>

        {/* Panel de Gestión de Usuarios */}
        <div hidden={currentTab !== 0}>
          {/* Aviso sobre gestión avanzada de usuarios */}
          <Alert 
            severity="info" 
            action={
              <Button color="inherit" size="small" endIcon={<LaunchIcon />} 
                onClick={() => window.location.href = '/users'}>
                Ir al Módulo Avanzado
              </Button>
            }
            sx={{ mb: 2 }}
          >
            Para gestión avanzada de usuarios con asignación de empresas, usa el <strong>Módulo de Gestión de Usuarios</strong>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Lista de Usuarios" />
                <CardContent>
                  <List>
                    {users.map((user, index) => (
                      <div key={user._id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography variant="h6">
                                  {user.fullName}
                                </Typography>
                                <Chip
                                  label={user.role}
                                  color={roleColors[user.role]}
                                  size="small"
                                  sx={{ ml: 2 }}
                                />
                                {!user.active && (
                                  <Chip
                                    label="Inactivo"
                                    color="error"
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Usuario: {user.username}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Email: {user.email || 'No especificado'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Último login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="edit">
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={user.role === 'superadmin'}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < users.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Estadísticas Rápidas" />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Total de usuarios:</Typography>
                    <Typography variant="h6">{stats.total}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Superadmins:</Typography>
                    <Typography variant="h6" color="error.main">{stats.superadmins}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Admins:</Typography>
                    <Typography variant="h6" color="primary.main">{stats.admins}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Facturadores:</Typography>
                    <Typography variant="h6" color="success.main">{stats.facturadores}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Auditores:</Typography>
                    <Typography variant="h6" color="warning.main">{stats.auditores}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Activos:</Typography>
                    <Typography variant="h6" color="success.main">{stats.active}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Inactivos:</Typography>
                    <Typography variant="h6" color="error.main">{stats.inactive}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>

        {/* Panel de Permisos (redirige a RolePermissions) */}
        <div hidden={currentTab !== 1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gestión de Permisos por Roles
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configura qué módulos puede ver cada rol del sistema
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.href = '/role-permissions'}
              >
                Ir a Gestión de Permisos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Estadísticas */}
        <div hidden={currentTab !== 2}>
          <Typography variant="h6">Estadísticas del Sistema</Typography>
          <Typography variant="body2" color="text.secondary">
            Próximamente: Métricas detalladas del sistema
          </Typography>
        </div>

        {/* Panel de Configuración */}
        <div hidden={currentTab !== 3}>
          <Typography variant="h6">Configuración del Sistema</Typography>
          <Typography variant="body2" color="text.secondary">
            Próximamente: Configuraciones avanzadas del sistema
          </Typography>
        </div>
      </Paper>

      {/* Dialog para crear usuario */}
      <Dialog
        open={openCreateUser}
        onClose={() => setOpenCreateUser(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de usuario"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Nombre completo"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Contraseña"
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos"
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Rol</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              label="Rol"
            >
              <MenuItem value="user">Usuario</MenuItem>
              <MenuItem value="facturador">Facturador</MenuItem>
              <MenuItem value="auditor">Auditor</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="superadmin">Super Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateUser(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateUser} variant="contained">
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminPanel;