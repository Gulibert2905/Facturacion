// src/pages/ContractManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import secureStorage from '../utils/secureStorage';
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
  Grid,
  Snackbar,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { Add, Search, Edit, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import es from 'date-fns/locale/es';

function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para el diálogo de edición/creación
  const [openDialog, setOpenDialog] = useState(false);
  const [currentContract, setCurrentContract] = useState({
    code: '',
    name: '',
    company: '',
    type: 'OTROS',
    validFrom: new Date(),
    validTo: null,
    status: 'active',
    tieneTecho: false,
    valorTecho: '',
    alertas: {
      porcentajeAlerta: 80,
      porcentajeCritico: 90
    }
  });
  
  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  
  // Cargar empresas y contratos
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        showAlert('Error al cargar empresas', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  }, []);
  
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCompany 
        ? `http://localhost:5000/api/companies/${selectedCompany}/contracts` 
        : 'http://localhost:5000/api/contracts';
        
      const token = secureStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
        setFilteredContracts(data);
      } else {
        showAlert('Error al cargar contratos', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts, selectedCompany]);
  
  // Filtrar contratos cuando cambia la búsqueda
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredContracts(contracts);
    } else {
      const filtered = contracts.filter(contract => 
        contract.name?.toLowerCase().includes(search.toLowerCase()) || 
        contract.code?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredContracts(filtered);
    }
  }, [search, contracts]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenDialog = (contract = null) => {
    if (contract) {
      setCurrentContract({
        ...contract,
        validFrom: contract.validFrom ? new Date(contract.validFrom) : new Date(),
        validTo: contract.validTo ? new Date(contract.validTo) : null,
        tieneTecho: contract.tieneTecho || false,
        valorTecho: contract.valorTecho || '',
        alertas: contract.alertas || {
          porcentajeAlerta: 80,
          porcentajeCritico: 90
        }
      });
    } else {
      setCurrentContract({
        code: '',
        name: '',
        company: selectedCompany || '',
        type: 'OTROS',
        validFrom: new Date(),
        validTo: null,
        status: 'active',
        tieneTecho: false,
        valorTecho: '',
        alertas: {
          porcentajeAlerta: 80,
          porcentajeCritico: 90
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
    setCurrentContract(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (name, date) => {
    setCurrentContract(prev => ({ ...prev, [name]: date }));
  };
  
  const handleStatusChange = (e) => {
    setCurrentContract(prev => ({ 
      ...prev, 
      status: e.target.checked ? 'active' : 'inactive' 
    }));
  };

  const handleTechoChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'tieneTecho') {
      setCurrentContract(prev => ({ 
        ...prev, 
        tieneTecho: checked,
        valorTecho: checked ? prev.valorTecho : ''
      }));
    } else if (name === 'valorTecho') {
      setCurrentContract(prev => ({ 
        ...prev, 
        valorTecho: value
      }));
    } else if (name.startsWith('alertas.')) {
      const alertKey = name.replace('alertas.', '');
      setCurrentContract(prev => ({ 
        ...prev, 
        alertas: {
          ...prev.alertas,
          [alertKey]: parseInt(value) || 0
        }
      }));
    }
  };
  
  const handleSaveContract = async () => {
    try {
      // Validar campos obligatorios
      if (!currentContract.name || !currentContract.company || !currentContract.validFrom) {
        showAlert('Nombre, empresa y fecha de inicio son obligatorios', 'error');
        return;
      }
      
      const isEditing = currentContract._id;
      const url = isEditing 
        ? `http://localhost:5000/api/contracts/${currentContract._id}`
        : 'http://localhost:5000/api/contracts';
      
      const token = secureStorage.getItem('token');
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(currentContract)
      });
      
      if (response.ok) {
        showAlert(isEditing ? 'Contrato actualizado' : 'Contrato creado', 'success');
        fetchContracts(); // Recargar la lista
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
  
  const handleDeleteContract = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este contrato? Esta acción no se puede deshacer.')) {
      try {
        const token = secureStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/contracts/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (response.ok) {
          showAlert('Contrato eliminado', 'success');
          fetchContracts(); // Recargar la lista
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

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  };

  // Obtener nombre de la empresa
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c._id === companyId);
    return company ? company.name : '-';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Contratos
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por Empresa</InputLabel>
              <Select
                value={selectedCompany}
                label="Filtrar por Empresa"
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <MenuItem value="">
                  <em>Todas las empresas</em>
                </MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Buscar por nombre o código"
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
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Contrato
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Vigencia</TableCell>
              <TableCell>Techo Presupuestal</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Cargando...</TableCell>
              </TableRow>
            ) : filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No hay contratos disponibles</TableCell>
              </TableRow>
            ) : (
              filteredContracts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((contract) => (
                  <TableRow key={contract._id}>
                    <TableCell>{contract.code || '-'}</TableCell>
                    <TableCell>{contract.name}</TableCell>
                    <TableCell>{getCompanyName(contract.company)}</TableCell>
                    <TableCell>{contract.type}</TableCell>
                    <TableCell>
                      {formatDate(contract.validFrom)} 
                      {contract.validTo ? ` - ${formatDate(contract.validTo)}` : ' - Indefinido'}
                    </TableCell>
                    <TableCell>
                      {contract.tieneTecho ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            ${contract.valorTecho?.toLocaleString() || '0'}
                          </Typography>
                          {contract.valorFacturado > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Facturado: ${contract.valorFacturado?.toLocaleString() || '0'}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin techo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        bgcolor: contract.status === 'active' ? 'success.light' : 'error.light',
                        color: contract.status === 'active' ? 'success.contrastText' : 'error.contrastText' 
                      }}>
                        {contract.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(contract)}
                        title="Editar"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteContract(contract._id)}
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
          count={filteredContracts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Diálogo para editar/crear contrato */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {currentContract._id ? 'Editar Contrato' : 'Crear Nuevo Contrato'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="code"
                  label="Código"
                  fullWidth
                  value={currentContract.code || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Contrato</InputLabel>
                  <Select
                    name="type"
                    value={currentContract.type}
                    label="Tipo de Contrato"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="LABORATORIO">LABORATORIO</MenuItem>
                    <MenuItem value="ODONTOLOGIA">ODONTOLOGÍA</MenuItem>
                    <MenuItem value="MEDICINA">MEDICINA</MenuItem>
                    <MenuItem value="OTROS">OTROS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre del Contrato"
                  fullWidth
                  value={currentContract.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    name="company"
                    value={currentContract.company}
                    label="Empresa"
                    onChange={handleInputChange}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company._id} value={company._id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Inicio *"
                  value={currentContract.validFrom}
                  onChange={(date) => handleDateChange('validFrom', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Fin"
                  value={currentContract.validTo}
                  onChange={(date) => handleDateChange('validTo', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Configuración de Techo Presupuestal</Divider>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="tieneTecho"
                      checked={currentContract.tieneTecho}
                      onChange={handleTechoChange}
                      color="primary"
                    />
                  }
                  label="Este contrato tiene techo presupuestal"
                />
              </Grid>
              
              {currentContract.tieneTecho && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="valorTecho"
                      label="Valor del Techo"
                      type="number"
                      fullWidth
                      value={currentContract.valorTecho}
                      onChange={handleTechoChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                      helperText="Valor máximo que se puede facturar en este contrato"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="alertas.porcentajeAlerta"
                      label="Porcentaje de Alerta"
                      type="number"
                      fullWidth
                      value={currentContract.alertas?.porcentajeAlerta || 80}
                      onChange={handleTechoChange}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100 }
                      }}
                      helperText="Se generará una alerta al alcanzar este porcentaje"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="alertas.porcentajeCritico"
                      label="Porcentaje Crítico"
                      type="number"
                      fullWidth
                      value={currentContract.alertas?.porcentajeCritico || 90}
                      onChange={handleTechoChange}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100 }
                      }}
                      helperText="Se generará una alerta crítica al alcanzar este porcentaje"
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Estado del Contrato</Divider>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentContract.status === 'active'}
                      onChange={handleStatusChange}
                      color="primary"
                    />
                  }
                  label="Contrato Activo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSaveContract} variant="contained">Guardar</Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
      
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

export default ContractManagement;