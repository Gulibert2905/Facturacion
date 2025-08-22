// src/components/audit/ServiceVerification.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import { useAudit } from '../../contexts/AuditContext';
import serviceVerificationService from '../services/audit/serviceVerificationService';

/**
 * Componente para verificación automática de servicios
 */
const ServiceVerification = () => {
  // Estado global de auditoría
  const { params, setParams } = useAudit();
  
  // Estados locales
  const [verificationTypes, setVerificationTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [verificationResults, setVerificationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    entityId: '',
    serviceCode: '',
    startDate: params.startDate,
    endDate: params.endDate
  });
  
  // Cargar tipos de verificación al montar el componente
  useEffect(() => {
    setVerificationTypes(serviceVerificationService.verificationType);
    setSelectedTypes(['auth_required', 'service_coverage', 'quantity_limits']);
  }, []);
  
  // Manejar selección de tipos de verificación
  const handleTypeSelect = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  
  // Ejecutar verificación
  const handleRunVerification = async () => {
    if (selectedTypes.length === 0) {
      setError('Debe seleccionar al menos un tipo de verificación');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);
      
      // Ejecutar verificación
      const response = await serviceVerificationService.verifyServices({
        ...filters,
        verificationTypes: selectedTypes
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Guardar resultados
      setVerificationResults(response.data);
    } catch (err) {
      setError('Error al ejecutar verificación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener nombre de tipo de verificación
  const getVerificationTypeName = (typeId) => {
    const type = verificationTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };
  
  // Renderizar chip de severidad
  const renderSeverityChip = (severity) => {
    const severityMap = {
      critical: { color: 'error', label: 'Crítico' },
      high: { color: 'warning', label: 'Alto' },
      medium: { color: 'primary', label: 'Medio' },
      low: { color: 'info', label: 'Bajo' },
      info: { color: 'success', label: 'Informativo' }
    };
    
    const { color, label } = severityMap[severity] || { color: 'default', label: severity };
    
    return (
      <Chip 
        size="small" 
        color={color} 
        label={label} 
      />
    );
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Panel de filtros */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Filtros de Verificación
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Entidad"
                  value={filters.entityId}
                  onChange={(e) => setFilters({ ...filters, entityId: e.target.value })}
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código de Servicio"
                  value={filters.serviceCode}
                  onChange={(e) => setFilters({ ...filters, serviceCode: e.target.value })}
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha Inicial"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  margin="normal"
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha Final"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  margin="normal"
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Tipos de verificación */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Tipos de Verificación
            </Typography>
            
            <FormGroup>
              <Grid container spacing={1}>
                {verificationTypes.map((type) => (
                  <Grid item xs={12} sm={6} key={type.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedTypes.includes(type.id)}
                          onChange={() => handleTypeSelect(type.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{type.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Botones de acción */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
            onClick={() => {
              setFilters({
                entityId: '',
                serviceCode: '',
                startDate: params.startDate,
                endDate: params.endDate
              });
              setSelectedTypes(['auth_required', 'service_coverage', 'quantity_limits']);
            }}
          >
            Reiniciar
          </Button>
          
          <LoadingButton
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            loading={loading}
            onClick={handleRunVerification}
          >
            Ejecutar Verificación
          </LoadingButton>
        </Box>
      </Paper>
      
      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Barra de progreso */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
            Verificando servicios... {progress}%
          </Typography>
        </Box>
      )}
      
      {/* Resultados de verificación */}
      {verificationResults && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Resumen de Verificación"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button
                  startIcon={<DownloadIcon />}
                  size="small"
                >
                  Exportar
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="overline" display="block">
                      Servicios Verificados
                    </Typography>
                    <Typography variant="h4">
                      {verificationResults.totalServices}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="overline" display="block" color="success.main">
                      Servicios Conformes
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {verificationResults.passedServices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {verificationResults.totalServices > 0 
                        ? Math.round((verificationResults.passedServices / verificationResults.totalServices) * 100) 
                        : 0}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="overline" display="block" color="error.main">
                      Servicios No Conformes
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {verificationResults.failedServices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {verificationResults.totalServices > 0 
                        ? Math.round((verificationResults.failedServices / verificationResults.totalServices) * 100) 
                        : 0}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Tabla de resultados detallados */}
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Resultados Detallados
              </Typography>
              
              <TextField
                size="small"
                placeholder="Buscar..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Divider />
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Servicio</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Entidad</TableCell>
                    <TableCell>Tipo de Verificación</TableCell>
                    <TableCell>Resultado</TableCell>
                    <TableCell>Severidad</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verificationResults.details.map((result) => (
                    <TableRow key={result.id} hover>
                      <TableCell>{result.serviceCode}</TableCell>
                      <TableCell>{new Date(result.date).toLocaleDateString()}</TableCell>
                      <TableCell>{result.entityName}</TableCell>
                      <TableCell>{getVerificationTypeName(result.verificationType)}</TableCell>
                      <TableCell>
                        {result.passed ? (
                          <Chip icon={<CheckCircleIcon />} label="Conforme" size="small" color="success" />
                        ) : (
                          <Chip icon={<ErrorIcon />} label="No Conforme" size="small" color="error" />
                        )}
                      </TableCell>
                      <TableCell>
                        {!result.passed && renderSeverityChip(result.severity)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver Detalles">
                          <IconButton size="small">
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ServiceVerification;