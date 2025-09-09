// src/pages/ContractTariffs.jsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Search, Edit, CloudUpload, ToggleOff, ToggleOn, Delete, GetApp, Add } from '@mui/icons-material';
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
  const [fullImportData, setFullImportData] = useState([]);
  
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
      const token = secureStorage.getItem('token');
      // Usar el nuevo endpoint optimizado que devuelve todos los servicios con sus tarifas
      const response = await fetch(`http://localhost:5000/api/cups/contract/${contractId}/services-with-tariffs`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (response.ok) {
        const servicesWithTariffs = await response.json();
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
      cupsCode: service ? service.cupsCode : '',
      description: service ? service.description : '',
      value: service ? service.value || 0 : 0,
      requiresAuthorization: service ? service.requiresAuthorization || false : false
    });
    setOpenDialog(true);
  };

  // Abrir diálogo para agregar nuevo servicio
  const handleAddNewService = () => {
    setCurrentTariff({
      cupsCode: '',
      description: '',
      value: 0,
      requiresAuthorization: false
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
      if (!currentTariff.cupsCode.trim()) {
        showAlert('El código CUPS es obligatorio', 'error');
        return;
      }
      if (!currentTariff.description.trim()) {
        showAlert('La descripción es obligatoria', 'error');
        return;
      }
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
          requiresAuthorization: currentTariff.requiresAuthorization,
          description: currentTariff.description
        })
      });
      
      if (response.ok) {
        showAlert('Tarifa guardada correctamente', 'success');
        handleCloseDialog();
        // Delay antes de recargar para asegurar que el servidor procesó el guardado
        setTimeout(() => {
          fetchServicesByContract(selectedContract); // Recargar la lista
        }, 500);
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
        
        console.log('📁 Datos completos del archivo:', data);
        setPreviewData(data.slice(0, 5)); // Mostrar los primeros 5 registros para vista previa
        setFullImportData(data); // Guardar todos los datos para importar
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
      console.log('📤 Enviando datos de importación completos:', fullImportData);
      console.log('📤 Cantidad de registros a importar:', fullImportData.length);
      console.log('📤 Contrato seleccionado:', selectedContract);
      
      const response = await fetch(`http://localhost:5000/api/cups/contract/${selectedContract}/import-tariffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariffs: fullImportData })
      });
      
      if (response.ok) {
        const result = await response.json();
        showAlert(result.message, 'success');
        setOpenImportDialog(false);
        // Delay antes de recargar para asegurar que el servidor procesó todas las importaciones
        setTimeout(() => {
          fetchServicesByContract(selectedContract); // Recargar la lista
        }, 1000);
      } else {
        const error = await response.json();
        showAlert(error.message || 'Error en la importación', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  };
  
  // Descargar plantilla de importación de tarifas
  const downloadTariffTemplate = () => {
    try {
      // Crear datos de ejemplo para la plantilla incluyendo descripción
      const templateData = [
        {
          cupsCode: '890201',
          description: 'Consulta de primera vez por medicina general',
          value: 50000,
          requiresAuthorization: false
        },
        {
          cupsCode: '890301',
          description: 'Consulta de primera vez por medicina especializada',
          value: 75000,
          requiresAuthorization: true
        },
        {
          cupsCode: '898001',
          description: 'Procedimiento diagnóstico especializado',
          value: 120000,
          requiresAuthorization: false
        }
      ];
      
      // Crear libro y hoja
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Añadir hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Plantilla Tarifas");
      
      // Generar archivo y descargar
      XLSX.writeFile(wb, 'plantilla_importacion_tarifas.xlsx');
      
      showAlert('Plantilla descargada correctamente', 'success');
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      showAlert('Error al descargar plantilla', 'error');
    }
  };
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Activar/Desactivar tarifa
  const handleToggleTariff = async (service, active) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cups/${service.cupsCode}/tariff/${selectedContract}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      
      if (response.ok) {
        showAlert(`Tarifa ${active ? 'activada' : 'desactivada'} correctamente`, 'success');
        // Pequeño delay antes de recargar para asegurar que el servidor procesó el cambio
        setTimeout(() => {
          fetchServicesByContract(selectedContract); // Recargar la lista
        }, 500);
      } else {
        const error = await response.json();
        showAlert(error.message || 'Error al cambiar estado de tarifa', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
  };

  // Eliminar tarifa
  const handleDeleteTariff = async (service) => {
    if (!window.confirm(`¿Está seguro de eliminar la tarifa para el servicio ${service.cupsCode}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/cups/${service.cupsCode}/tariff/${selectedContract}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showAlert('Tarifa eliminada correctamente', 'success');
        // Pequeño delay antes de recargar para asegurar que el servidor procesó la eliminación
        setTimeout(() => {
          fetchServicesByContract(selectedContract); // Recargar la lista
        }, 500);
      } else {
        const error = await response.json();
        showAlert(error.message || 'Error al eliminar tarifa', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    }
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
                startIcon={<GetApp />}
                onClick={downloadTariffTemplate}
                size="small"
              >
                Descargar Plantilla
              </Button>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={!selectedContract}
                size="small"
              >
                Importar Tarifas
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {selectedContract && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNewService}
              size="small"
              disabled={!selectedContract}
            >
              Agregar Servicio
            </Button>
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
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No hay servicios CUPS asignados a este contrato
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Los servicios se crearán automáticamente cuando importes tarifas o agregues servicios manualmente
                        </Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<GetApp />}
                          onClick={downloadTariffTemplate}
                          size="small"
                        >
                          Descargar Plantilla para Empezar
                        </Button>
                      </Box>
                    </TableCell>
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
                            service.active ? (
                              <Box sx={{ 
                                display: 'inline-block', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1, 
                                bgcolor: 'success.light',
                                color: 'success.contrastText' 
                              }}>
                                Activo
                              </Box>
                            ) : (
                              <Box sx={{ 
                                display: 'inline-block', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1, 
                                bgcolor: 'error.light',
                                color: 'error.contrastText' 
                              }}>
                                Inactivo
                              </Box>
                            )
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
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(service)}
                              title="Editar tarifa"
                            >
                              <Edit />
                            </IconButton>
                            
                            {service.hasTariff && service.value > 0 && (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleToggleTariff(service, !service.active)}
                                  title={service.active ? "Desactivar tarifa" : "Activar tarifa"}
                                  color={service.active ? "warning" : "success"}
                                >
                                  {service.active ? <ToggleOff /> : <ToggleOn />}
                                </IconButton>
                                
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteTariff(service)}
                                  title="Eliminar tarifa"
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </>
                            )}
                          </Box>
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
          {currentTariff.cupsCode ? `Editar tarifa para ${currentTariff.cupsCode}` : 'Agregar nuevo servicio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="cupsCode"
                label="Código CUPS"
                fullWidth
                value={currentTariff.cupsCode}
                onChange={handleInputChange}
                disabled={!!currentTariff.cupsCode} // Solo editable cuando es nuevo
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                value={currentTariff.description}
                onChange={handleInputChange}
                multiline
                rows={2}
                required
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
                Se importarán {fullImportData.length} tarifas para el contrato seleccionado. Vista previa de los primeros 5:
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