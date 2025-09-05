import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  Pagination,
  Autocomplete,
  Checkbox,
  ListItemText
} from '@mui/material';
import authService from '../components/services/authService';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [systemInfo, setSystemInfo] = useState({ roles: [], modules: [], actions: [] });
  
  // Filtros y paginación
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    active: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Formulario
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: '',
    department: '',
    phone: '',
    active: true,
    customPermissions: [],
    assignedCompanies: [],
    canViewAllCompanies: false
  });

  // Estado para las empresas disponibles
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchSystemInfo();
    fetchUsers();
    fetchCompanies();
  }, [pagination.page, pagination.limit, filters]);

  // Set default role when systemInfo is loaded
  useEffect(() => {
    if (systemInfo.roles.length > 0 && !formData.role && !editingUser) {
      const defaultRole = systemInfo.roles.find(r => r.value === 'facturador')?.value || systemInfo.roles[0]?.value || '';
      setFormData(prev => ({ ...prev, role: defaultRole }));
    }
  }, [systemInfo.roles, formData.role, editingUser]);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/system-info`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        throw new Error('Error fetching users');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // No mostrar password
        fullName: user.fullName,
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
        active: user.active,
        customPermissions: user.customPermissions || [],
        assignedCompanies: user.assignedCompanies || [],
        canViewAllCompanies: user.canViewAllCompanies || false
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: systemInfo.roles.length > 0 ? systemInfo.roles.find(r => r.value === 'facturador')?.value || systemInfo.roles[0]?.value || '' : '',
        department: '',
        phone: '',
        active: true,
        customPermissions: [],
        assignedCompanies: [],
        canViewAllCompanies: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const method = editingUser ? 'PUT' : 'POST';
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullUrl = editingUser 
        ? `${apiUrl}/api/users/${editingUser._id}` 
        : `${apiUrl}/api/users`;
        
      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        handleCloseDialog();
        fetchUsers();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Error saving user');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        throw new Error('Error changing user status');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const getRoleLabel = (role) => {
    const roleObj = systemInfo.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: 'error',
      admin: 'warning',
      facturador: 'primary',
      auditor: 'info',
      reportes: 'secondary',
      rips: 'success',
      custom: 'default'
    };
    return colors[role] || 'default';
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <PersonIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rol</InputLabel>
            <Select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              label="Rol"
            >
              <MenuItem value="">Todos</MenuItem>
              {systemInfo.roles.map(role => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              label="Estado"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="true">Activos</MenuItem>
              <MenuItem value="false">Inactivos</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Empresas</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Último Login</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>
                  {user.canViewAllCompanies ? (
                    <Chip label="Todas las empresas" color="primary" size="small" />
                  ) : user.assignedCompanies && user.assignedCompanies.length > 0 ? (
                    <Tooltip title={user.assignedCompanies.map(c => c.nombre || c.name).join(', ')}>
                      <Chip 
                        label={`${user.assignedCompanies.length} empresa${user.assignedCompanies.length > 1 ? 's' : ''}`} 
                        color="info" 
                        size="small" 
                      />
                    </Tooltip>
                  ) : (
                    <Chip label="Sin empresas" color="warning" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={user.active ? 'Activo' : 'Inactivo'}
                      color={user.active ? 'success' : 'error'}
                      size="small"
                    />
                    {user.isLocked && (
                      <Tooltip title="Usuario bloqueado">
                        <LockIcon color="error" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar usuario">
                    <IconButton
                      onClick={() => handleOpenDialog(user)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.active ? 'Desactivar' : 'Activar'}>
                    <IconButton
                      onClick={() => handleToggleStatus(user._id)}
                      color={user.active ? 'error' : 'success'}
                    >
                      {user.active ? <LockIcon /> : <LockOpenIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={pagination.pages}
          page={pagination.page}
          onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
          color="primary"
        />
      </Box>

      {/* Dialog para crear/editar usuario */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        aria-labelledby="user-dialog-title"
        aria-describedby="user-dialog-description"
      >
        <DialogTitle id="user-dialog-title">
          <Box display="flex" alignItems="center">
            <SecurityIcon sx={{ mr: 1 }} />
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2}>
                <TextField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  fullWidth
                  disabled={editingUser} // No permitir cambiar username
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  fullWidth
                />
              </Box>
              
              <TextField
                label={editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!editingUser}
                fullWidth
                helperText={editingUser ? 'Dejar vacío para mantener contraseña actual' : ''}
              />
              
              <TextField
                label="Nombre Completo"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                fullWidth
              />
              
              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    label="Rol"
                  >
                    {systemInfo.roles.map(role => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {role.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Departamento"
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  fullWidth
                />
              </Box>
              
              <TextField
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                fullWidth
              />
              
              {/* Asignación de Empresas */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.canViewAllCompanies}
                      onChange={(e) => setFormData({...formData, canViewAllCompanies: e.target.checked, assignedCompanies: e.target.checked ? [] : formData.assignedCompanies})}
                    />
                  }
                  label="Puede ver todas las empresas"
                />
                
                {!formData.canViewAllCompanies && (
                  <Autocomplete
                    multiple
                    options={companies}
                    getOptionLabel={(option) => option.nombre || option.name || ''}
                    value={companies.filter(company => formData.assignedCompanies.includes(company._id))}
                    onChange={(event, newValue) => {
                      setFormData({...formData, assignedCompanies: newValue.map(company => company._id)});
                    }}
                    renderOption={(props, option, { selected }) => {
                      const { key, ...otherProps } = props;
                      return (
                        <li key={key} {...otherProps}>
                          <Checkbox
                            style={{ marginRight: 8 }}
                            checked={selected}
                          />
                          <ListItemText primary={option.nombre || option.name} secondary={`NIT: ${option.nit}`} />
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Empresas asignadas"
                        placeholder="Seleccionar empresas..."
                        helperText="Selecciona las empresas que puede ver este usuario"
                      />
                    )}
                  />
                )}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                }
                label="Usuario activo"
              />
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default UserManagement;