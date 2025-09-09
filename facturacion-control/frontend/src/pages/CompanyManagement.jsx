// src/pages/CompanyManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Grid,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add, Search, Edit, Delete } from '@mui/icons-material';

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para el diálogo de edición/creación
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCompany, setCurrentCompany] = useState({
    name: '',
    nit: '',
    code: '',
    status: 'active',
    billingConfigs: {
      prefixes: [],
      costCenter: '',
      defaultBranch: ''
    }
  });
  
  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  
  // Cargar empresas
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        setFilteredCompanies(data);
      } else {
        showAlert('Error al cargar empresas', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  // Filtrar empresas cuando cambia la búsqueda
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(search.toLowerCase()) || 
        company.nit.toLowerCase().includes(search.toLowerCase()) ||
        company.code?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [search, companies]);
  
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenDialog = (company = null) => {
    if (company) {
      setCurrentCompany({
        ...company,
        billingConfigs: company.billingConfigs || {
          prefixes: [],
          costCenter: '',
          defaultBranch: ''
        }
      });
    } else {
      setCurrentCompany({
        name: '',
        nit: '',
        code: '',
        status: 'active',
        billingConfigs: {
          prefixes: [],
          costCenter: '',
          defaultBranch: ''
        }
      });
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCurrentCompany(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCurrentCompany(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleStatusChange = (e) => {
    setCurrentCompany(prev => ({ 
      ...prev, 
      status: e.target.checked ? 'active' : 'inactive' 
    }));
  };
  
  const handleSaveCompany = async () => {
    try {
      // Validar campos obligatorios
      if (!currentCompany.name || !currentCompany.nit) {
        showAlert('Nombre y NIT son obligatorios', 'error');
        return;
      }
      
      const isEditing = currentCompany._id;
      const url = isEditing 
        ? `http://localhost:5000/api/companies/${currentCompany._id}`
        : 'http://localhost:5000/api/companies';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCompany)
      });
      
      if (response.ok) {
        showAlert(isEditing ? 'Empresa actualizada' : 'Empresa creada', 'success');
        fetchCompanies(); // Recargar la lista
        handleCloseDialog();
      } else {
        const error = await response.json();
        showAlert(error.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  };
  
  const handleDeleteCompany = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta empresa? Esto podría afectar a contratos y servicios relacionados.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/companies/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showAlert('Empresa eliminada', 'success');
          fetchCompanies(); // Recargar la lista
        } else {
          const error = await response.json();
          showAlert(error.message || 'Error al eliminar', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlert('Error de conexión', 'error');
      }
    }
  };
  
  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Empresas
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          placeholder="Buscar por nombre, NIT o código"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ width: 300 }}
        />
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Empresa
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>NIT</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Cargando...</TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay empresas disponibles</TableCell>
              </TableRow>
            ) : (
              filteredCompanies
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((company) => (
                  <TableRow key={company._id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.nit}</TableCell>
                    <TableCell>{company.code || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        bgcolor: company.status === 'active' ? 'success.light' : 'error.light',
                        color: company.status === 'active' ? 'success.contrastText' : 'error.contrastText' 
                      }}>
                        {company.status === 'active' ? 'Activa' : 'Inactiva'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(company)}
                        title="Editar"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteCompany(company._id)}
                        title="Eliminar"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredCompanies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Diálogo para editar/crear empresa */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        disablePortal={false}
        hideBackdrop={false}
        disableEnforceFocus={false}
        disableAutoFocus={false}
        disableRestoreFocus={false}
        componentsProps={{
          backdrop: {
            sx: { 
              backgroundColor: 'rgba(0, 0, 0, 0.5)' 
            }
          }
        }}
      >
        <DialogTitle>
          {currentCompany._id ? 'Editar Empresa' : 'Crear Nueva Empresa'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nombre de la Empresa"
                fullWidth
                value={currentCompany.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="nit"
                label="NIT"
                fullWidth
                value={currentCompany.nit}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="code"
                label="Código"
                fullWidth
                value={currentCompany.code || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentCompany.status === 'active'}
                    onChange={handleStatusChange}
                    color="primary"
                  />
                }
                label="Empresa Activa"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Configuración de Facturación</Typography>
              <Divider />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="billingConfigs.costCenter"
                label="Centro de Costos"
                fullWidth
                value={currentCompany.billingConfigs?.costCenter || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="billingConfigs.defaultBranch"
                label="Sucursal por Defecto"
                fullWidth
                value={currentCompany.billingConfigs?.defaultBranch || ''}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveCompany} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Alertas */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CompanyManagement;