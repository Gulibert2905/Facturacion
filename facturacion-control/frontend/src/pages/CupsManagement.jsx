// src/pages/CupsManagement.jsx
import React, { useState, useEffect } from 'react';
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
  Snackbar
} from '@mui/material';
import { Add, Search, Edit, Delete, CloudUpload } from '@mui/icons-material';
import * as XLSX from 'xlsx';

function CupsManagement() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para el diálogo de edición/creación
  const [openDialog, setOpenDialog] = useState(false);
  const [currentService, setCurrentService] = useState({
    cupsCode: '',
    description: '',
    category: ''
  });
  
  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  
  // Estado para diálogo de importación
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  
  // Cargar servicios
  useEffect(() => {
    fetchServices();
  }, []);
  
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
  
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/cups');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        setFilteredServices(data);
      } else {
        showAlert('Error al cargar servicios', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenDialog = (service = null) => {
    if (service) {
      setCurrentService(service);
    } else {
      setCurrentService({ cupsCode: '', description: '', category: '' });
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentService(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveService = async () => {
    try {
      // Validar campos obligatorios
      if (!currentService.cupsCode || !currentService.description) {
        showAlert('Código CUPS y descripción son obligatorios', 'error');
        return;
      }
      const token = localStorage.getItem('token'); 
      const isEditing = services.some(s => s.cupsCode === currentService.cupsCode);
      const url = isEditing 
        ? `http://localhost:5000/api/cups/${currentService.cupsCode}`
        : 'http://localhost:5000/api/cups';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${token}` },
        body: JSON.stringify(currentService)
      });
      
      if (response.ok) {
        showAlert(isEditing ? 'Servicio actualizado' : 'Servicio creado', 'success');
        fetchServices(); // Recargar la lista
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
  
  const handleDeleteService = async (cupsCode) => {
    if (window.confirm(`¿Estás seguro de eliminar el servicio ${cupsCode}?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/cups/${cupsCode}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showAlert('Servicio eliminado', 'success');
          fetchServices(); // Recargar la lista
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
        if (!firstRow.cupsCode || !firstRow.description) {
          showAlert('El archivo debe tener columnas "cupsCode" y "description"', 'error');
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
  
  const handleImport = async () => {
    try {
      const token = secureStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cups/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ services: previewData })
      });
      
      if (response.ok) {
        const result = await response.json();
        showAlert(result.message, 'success');
        fetchServices(); // Recargar la lista
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
  
  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Servicios CUPS
      </Typography>
      
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
        
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 1 }}
          >
            Nuevo Servicio
          </Button>
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUpload />}
          >
            Importar
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código CUPS</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">Cargando...</TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay servicios disponibles</TableCell>
              </TableRow>
            ) : (
              filteredServices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((service) => (
                  <TableRow key={service.cupsCode}>
                    <TableCell>{service.cupsCode}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>{service.category || '-'}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(service)}
                        title="Editar"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteService(service.cupsCode)}
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
          count={filteredServices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Diálogo para editar/crear servicio */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentService.cupsCode ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="cupsCode"
                label="Código CUPS"
                fullWidth
                value={currentService.cupsCode}
                onChange={handleInputChange}
                disabled={!!currentService._id} // Deshabilitar si es edición
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="category"
                label="Categoría"
                fullWidth
                value={currentService.category || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                value={currentService.description || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveService} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para previsualizar importación */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vista previa de importación</DialogTitle>
        <DialogContent>
          {previewData.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Se importarán {previewData.length} servicios. Vista previa de los primeros 5:
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código CUPS</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Categoría</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.cupsCode}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
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
          <Button onClick={handleImport} variant="contained">Importar</Button>
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

export default CupsManagement;