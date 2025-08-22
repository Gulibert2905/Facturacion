// src/components/rips/RipsHistory.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FileCopy as FileCopyIcon
} from '@mui/icons-material';

import { useRips } from '../../contexts/RipsContext';
import ripsService from '../../services/rips/ripsService';
import ripsExportService from '../../services/rips/ripsExportService';

/**
 * Componente para mostrar el historial de generación de RIPS
 */
const RipsHistory = () => {
  // Estado global de RIPS
  const { addToHistory } = useRips();
  
  // Estados locales
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Cargar historial al montar el componente
  useEffect(() => {
    loadHistory();
  }, []);
  
  // Cargar historial de RIPS
  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = searchTerm ? { search: searchTerm } : {};
      const response = await ripsService.getRipsHistory(filters);
      setHistory(response.data || []);
    } catch (err) {
      setError('Error al cargar el historial: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Manejar búsqueda
  const handleSearch = () => {
    loadHistory();
  };
  
  // Manejar exportación
  const handleExport = async (item, format) => {
    try {
      await ripsExportService.exportRips(item.id, format, item.resolution);
    } catch (err) {
      setError('Error al exportar: ' + err.message);
    }
  };
  
  // Mostrar detalles
  const handleShowDetails = (item) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };
  
  // Cerrar diálogo de detalles
  const handleCloseDetail = () => {
    setDetailOpen(false);
  };
  
  // Mostrar estado con color
  const getStatusChip = (status) => {
    switch (status) {
      case 'completed':
        return <Chip size="small" label="Completado" color="success" />;
      case 'processing':
        return <Chip size="small" label="Procesando" color="warning" />;
      case 'error':
        return <Chip size="small" label="Error" color="error" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Historial de generación de RIPS
      </Typography>
      
      {/* Barra de búsqueda y acciones */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Buscar por entidad o fecha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ width: 300 }}
        />
        
        <Box>
          <Button 
            startIcon={<SearchIcon />}
            variant="contained" 
            onClick={handleSearch}
            size="small"
            sx={{ mr: 1 }}
          >
            Buscar
          </Button>
          <Button 
            startIcon={<RefreshIcon />}
            variant="outlined" 
            onClick={loadHistory}
            size="small"
          >
            Actualizar
          </Button>
        </Box>
      </Box>
      
      {/* Tabla de historial */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha de generación</TableCell>
                <TableCell>Entidad</TableCell>
                <TableCell>Período</TableCell>
                <TableCell>Resolución</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {loading ? 'Cargando historial...' : 'No hay registros en el historial'}
                  </TableCell>
                </TableRow>
              ) : (
                history
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>{item.entityName}</TableCell>
                      <TableCell>
                        {item.startDate} a {item.endDate}
                      </TableCell>
                      <TableCell>
                        {item.resolution === '3374' ? 'Res. 3374/2000' : 'Res. 2275/2023'}
                      </TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Descargar TXT">
                          <IconButton 
                            size="small" 
                            onClick={() => handleExport(item, 'TXT')}
                            disabled={item.status !== 'completed'}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small" 
                            onClick={() => handleShowDetails(item)}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={history.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Diálogo de detalles */}
      {selectedItem && (
        <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md">
          <DialogTitle>
            Detalles del RIPS
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Información general:</Typography>
                <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 1 }}>
                  <Box component="dt" sx={{ fontWeight: 'bold' }}>ID:</Box>
                  <Box component="dd">{selectedItem.id}</Box>
                  
                  <Box component="dt" sx={{ fontWeight: 'bold' }}>Entidad:</Box>
                  <Box component="dd">{selectedItem.entityName} ({selectedItem.entityCode})</Box>
                  
                  <Box component="dt" sx={{ fontWeight: 'bold' }}>Período:</Box>
                  <Box component="dd">{selectedItem.startDate} a {selectedItem.endDate}</Box>
                  
                  <Box component="dt" sx={{ fontWeight: 'bold' }}>Resolución:</Box>
                  <Box component="dd">
                    {selectedItem.resolution === '3374' ? 'Resolución 3374 de 2000' : 'Resolución 2275 de 2023'}
                  </Box>
                  
                  <Box component="dt" sx={{ fontWeight: 'bold' }}>Estado:</Box>
                  <Box component="dd">{getStatusChip(selectedItem.status)}</Box>
                  
                  <Box component="dt" sx={{ fontWeight: 'bold' }}>Creado:</Box>
                  <Box component="dd">{formatDate(selectedItem.createdAt)}</Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Archivos generados:</Typography>
                {selectedItem.files && selectedItem.files.map((file) => (
                  <Chip 
                    key={file.code}
                    label={`${file.code} - ${file.name}`}
                    variant="outlined"
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
                
                {(!selectedItem.files || selectedItem.files.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    No hay información detallada sobre los archivos.
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2">Exportar en formato:</Typography>
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport(selectedItem, 'TXT')}
                    disabled={selectedItem.status !== 'completed'}
                    sx={{ mr: 1 }}
                  >
                    TXT
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport(selectedItem, 'CSV')}
                    disabled={selectedItem.status !== 'completed'}
                    sx={{ mr: 1 }}
                  >
                    CSV
                  </Button>
                  {selectedItem.resolution === '2275' && (
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExport(selectedItem, 'XML')}
                      disabled={selectedItem.status !== 'completed'}
                    >
                      XML
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default RipsHistory;