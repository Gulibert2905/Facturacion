// src/pages/ContractTariffs.jsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Search, Edit, CloudUpload, SaveAlt } from '@mui/icons-material';
import * as XLSX from 'xlsx';

function ContractTariffs() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para selección de empresa y contrato
  const [companies, setCompanies] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  
  // Estado para el diálogo de edición de tarifa
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTariff, setCurrentTariff] = useState({
    cupsCode: '',
    description: '',
    value: 0,
    requiresAuthorization: false
  });
  
  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  
  // Estado para diálogo de importación
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  
  // Definir funciones con useCallback para usarlas en dependencias
  const showAlert = useCallback((message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  }, []);
  
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
  }, [showAlert]);
  
  const fetchContracts = useCallback(async (companyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}/contracts`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      } else {
        showAlert('Error al cargar contratos', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  }, [showAlert]);
  
  const fetchServicesByContract = useCallback(async (contractId) => {
    setLoading(true);
    try {
      // Primero, obtenemos todos los servicios
      const response = await fetch('http://localhost:5000/api/cups');
      if (response.ok) {
        const allServices = await response.json();
        
        // Para cada servicio, verificamos si tiene tarifa para este contrato
        const servicesWithTariffs = await Promise.all(allServices.map(async (service) => {
          try {
            const tariffResponse = await fetch(`http://localhost:5000/api/cups/${service.cupsCode}/tariff/${contractId}`);
            if (tariffResponse.ok) {
              const tariffData = await tariffResponse.json();
              return {
                ...service,
                value: tariffData.value,
                requiresAuthorization: tariffData.requiresAuthorization,
                hasTariff: true
              };
            } else {
              return {
                ...service,
                value: 0,
                requiresAuthorization: false,
                hasTariff: false
              };
            }
          } catch (error) {
            return {
              ...service,
              value: 0,
              requiresAuthorization: false,
              hasTariff: false
            };
          }
        }));
        
        setServices(servicesWithTariffs);
        setFilteredServices(servicesWithTariffs);
      } else {
        showAlert('Error al cargar servicios', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);
  
  // Cargar empresas al inicio
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  // Cargar contratos cuando cambia la empresa seleccionada
  useEffect(() => {
    if (selectedCompany) {
      fetchContracts(selectedCompany);
    } else {
      setContracts([]);
      setSelectedContract('');
    }
  }, [selectedCompany, fetchContracts]);
  
  // Cargar servicios cuando cambia el contrato seleccionado
  useEffect(() => {
    if (selectedContract) {
      fetchServicesByContract(selectedContract);
    } else {
      setServices([]);
      setFilteredServices([]);
    }
  }, [selectedContract, fetchServicesByContract]);
  
  // Filtrar servicios cuando cambia la búsqueda
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service => 
        service.cupsCode.toLowerCase().includes(search.toLowerCase()) || 
        service.description.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [search, services]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenDialog = (service) => {
    setCurrentTariff({
      cupsCode: service.cupsCode,
      description: service.description,
      value: service.value || 0,
      requiresAuthorization: service.requiresAuthorization || false
    });
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setCurrentTariff(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSaveTariff = async () => {
    try {
      // Validar campos obligatorios
      if (currentTariff.value <= 0) {
        showAlert('El valor debe ser mayor que cero', 'error');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/cups/${currentTariff.cupsCode}/tariff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContract,
          value: parseFloat(currentTariff.value),
          requiresAuthorization: currentTariff.requiresAuthorization
        })
      });
      
      if (response.ok) {
        showAlert('Tarifa guardada correctamente', 'success');
        fetchServicesByContract(selectedContract); // Recargar la lista
        handleCloseDialog();
      } else {
        const error = await response.json();
        showAlert(error.message || 'Error al guardar tarifa', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        if (data.length === 0) {
          showAlert('El archivo está vacío', 'error');
          return;
        }
        
        // Verificar que tenga las columnas necesarias
        const firstRow = data[0];
        if (!firstRow.cupsCode || firstRow.value === undefined) {
          showAlert('El archivo debe tener columnas "cupsCode" y "value"', 'error');
          return;
        }
        
        setPreviewData(data.slice(0, 5)); // Mostrar los primeros 5 registros
        setOpenImportDialog(true);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        showAlert('Error al procesar el archivo', 'error');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  const handleImportTariffs = async () => {
    if (!selectedContract) {
      showAlert('Debe seleccionar un contrato', 'error');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/cups/contract/${selectedContract}/import-tariffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariffs: previewData })
      });
      
      if (response.ok) {
        const result = await response.json();
        showAlert(result.message, 'success');
        fetchServicesByContract(selectedContract); // Recargar la lista
        setOpenImportDialog(false);
      } else {
        const error = await response.json();
        showAlert(error.message || 'Error en la importación', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  };
  
  const exportTariffsToExcel = () => {
    if (!selectedContract || services.length === 0) {
      showAlert('No hay datos para exportar', 'error');
      return;
    }
    
    try {
      // Formatear datos para exportación
      const exportData = services.map(service => ({
        cupsCode: service.cupsCode,
        description: service.description,
        value: service.value || 0,
        requiresAuthorization: service.requiresAuthorization ? 'Sí' : 'No'
      }));
      
      // Crear libro y hoja
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Añadir hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Tarifas");
      
      // Obtener nombre del contrato seleccionado
      const contract = contracts.find(c => c._id === selectedContract);
      const contractName = contract ? contract.name : 'contrato';
      
      // Generar archivo y descargar
      XLSX.writeFile(wb, `tarifas_${contractName}.xlsx`);
      
      showAlert('Tarifas exportadas correctamente', 'success');
    } catch (error) {
      console.error('Error exportando tarifas:', error);
      showAlert('Error al exportar tarifas', 'error');
    }
  };
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Tarifas por Contrato
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={selectedCompany}
                label="Empresa"
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccione una empresa</em>
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
            <FormControl fullWidth size="small" disabled={!selectedCompany}>
              <InputLabel>Contrato</InputLabel>
              <Select
                value={selectedContract}
                label="Contrato"
                onChange={(e) => setSelectedContract(e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccione un contrato</em>
                </MenuItem>
                {contracts.map((contract) => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={!selectedContract}
              >
                Importar
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SaveAlt />}
                onClick={exportTariffsToExcel}
                disabled={!selectedContract || services.length === 0}
              >
                Exportar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {selectedContract && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              placeholder="Buscar por código o descripción"
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
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código CUPS</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Autorización</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Cargando...</TableCell>
                  </TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No hay servicios disponibles</TableCell>
                  </TableRow>
                ) : (
                  filteredServices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((service) => (
                      <TableRow key={service.cupsCode}>
                        <TableCell>{service.cupsCode}</TableCell>
                        <TableCell>{service.description}</TableCell>
                        <TableCell align="right">
                          {service.value ? service.value.toLocaleString('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }) : '-'}
                        </TableCell>
                        <TableCell>
                          {service.requiresAuthorization ? 'Sí' : 'No'}
                        </TableCell>
                        <TableCell>
                          {service.hasTariff ? (
                            <Box sx={{ 
                              display: 'inline-block', 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: 'success.light',
                              color: 'success.contrastText' 
                            }}>
                              Asignado
                            </Box>
                          ) : (
                            <Box sx={{ 
                              display: 'inline-block', 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: 'warning.light',
                              color: 'warning.contrastText'
                            }}>
                              Pendiente
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(service)}
                            title="Editar tarifa"
                          >
                            <Edit />
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
              count={filteredServices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}
      
      {/* Diálogo para editar tarifa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Asignar tarifa para {currentTariff.cupsCode}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Código CUPS"
                fullWidth
                value={currentTariff.cupsCode}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                value={currentTariff.description}
                disabled
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="value"
                label="Valor"
                fullWidth
                type="number"
                value={currentTariff.value}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="requiresAuthorization"
                    checked={currentTariff.requiresAuthorization}
                    onChange={handleInputChange}
                  />
                }
                label="Requiere autorización"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveTariff} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para previsualizar importación */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vista previa de importación de tarifas</DialogTitle>
        <DialogContent>
          {previewData.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Se importarán {previewData.length} tarifas para el contrato seleccionado. Vista previa:
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código CUPS</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Autorización</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.cupsCode}</TableCell>
                        <TableCell align="right">
                          {Number(item.value).toLocaleString('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          })}
                        </TableCell>
                        <TableCell>
                          {item.requiresAuthorization ? 'Sí' : 'No'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>Cancelar</Button>
          <Button onClick={handleImportTariffs} variant="contained">Importar</Button>
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

export default ContractTariffs;