// src/components/ValidacionPrefactura.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  LinearProgress,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  InfoOutlined,
  PriorityHigh,
  VerifiedUser,
  Send,
  Refresh,
  Edit,
  Delete,
  Close,
  Save,
  ArrowForward
} from '@mui/icons-material';

import useApi from '../hooks/useApi';
import { useNotification } from '../contexts/NotificationContext';
import { validationService } from '../components/services/validationService';
import { formatCurrency, formatDate } from '../utils/formatters';

// Componente para mostrar el resumen de validación
const ValidationSummary = ({ validationResult }) => {
  const { errors, warnings, status } = validationResult;

  // Iconos y colores según el estado
  const statusConfig = {
    valid: {
      icon: <CheckCircle fontSize="large" />,
      color: 'success.main',
      text: 'Prefacturación válida'
    },
    warning: {
      icon: <Warning fontSize="large" />,
      color: 'warning.main',
      text: 'Prefacturación con advertencias'
    },
    error: {
      icon: <Error fontSize="large" />,
      color: 'error.main',
      text: 'Prefacturación con errores'
    }
  };

  const config = statusConfig[status] || statusConfig.error;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: config.color, mr: 2 }}>
            {config.icon}
          </Box>
          <Typography variant="h6">{config.text}</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Errores ({errors.length})
              </Typography>
            </Box>

            {errors.length > 0 ? (
              <List dense sx={{ bgcolor: 'error.lighter', borderRadius: 1, p: 1 }}>
                {errors.map((error, index) => (
                  <ListItem key={`error-${index}`}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <Error color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No se encontraron errores.
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Advertencias ({warnings.length})
              </Typography>
            </Box>

            {warnings.length > 0 ? (
              <List dense sx={{ bgcolor: 'warning.lighter', borderRadius: 1, p: 1 }}>
                {warnings.map((warning, index) => (
                  <ListItem key={`warning-${index}`}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No se encontraron advertencias.
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Componente para validar una prefactura
const ValidacionPrefactura = ({ preBillId, onValidate, onCancel }) => {
  // Estado para tracking de validación
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStep, setValidationStep] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [validationDetails, setValidationDetails] = useState([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Hooks
  const { showSuccess, showError, showWarning } = useNotification();
  
  // Obtener datos de la prefactura
  const { 
    data: preBill, 
    loading: loadingPreBill,
    error: preBillError
  } = useApi(`/prebills/${preBillId}`);

  // Validar cuando los datos están disponibles
  useEffect(() => {
    if (preBill && !loadingPreBill) {
      validatePreBill();
    }
  }, [preBill, loadingPreBill]);

  // Mostrar error si existe
  useEffect(() => {
    if (preBillError) {
      showError('Error al cargar la prefactura', { 
        title: 'Error de carga',
        autoHideDuration: 8000
      });
    }
  }, [preBillError, showError]);

  // Función de validación de prefactura
  const validatePreBill = async () => {
    if (!preBill) return;

    try {
      // Iniciar validación
      setValidationProgress(0);
      setValidationStep('Iniciando validación...');
      
      // Simular proceso de validación
      await simulateProgress(20, 'Verificando estructura de datos...');
      
      // Validar estructura básica
      const basicValidation = validationService.validatePreBilling(preBill);
      setValidationResult(basicValidation);
      
      // Continuar validación detallada si no hay errores críticos
      if (basicValidation.isValid) {
        await simulateProgress(40, 'Verificando servicios...');
        
        // Validar cada servicio
        const servicesValidation = await validateServices(preBill.services || []);
        setValidationDetails(servicesValidation);
        
        await simulateProgress(70, 'Verificando pacientes...');
        
        // Calcular estado final
        const hasServiceErrors = servicesValidation.some(sv => sv.status === 'error');
        const hasServiceWarnings = servicesValidation.some(sv => sv.status === 'warning');
        
        // Actualizar resultado con estado de validación de servicios
        if (hasServiceErrors) {
          setValidationResult(prev => ({
            ...prev,
            status: 'error',
            errors: [...prev.errors, 'Se encontraron errores en algunos servicios'],
            isValid: false
          }));
        } else if (hasServiceWarnings && basicValidation.status !== 'error') {
          setValidationResult(prev => ({
            ...prev,
            status: 'warning',
            hasWarnings: true
          }));
        }
        
        await simulateProgress(100, 'Validación completada');
        
        // Mostrar notificación según el resultado
        if (hasServiceErrors || !basicValidation.isValid) {
          showError('La prefactura contiene errores que deben corregirse', {
            title: 'Validación fallida'
          });
        } else if (hasServiceWarnings || basicValidation.hasWarnings) {
          showWarning('La prefactura contiene advertencias que podrían requerir atención', {
            title: 'Validación con advertencias'
          });
        } else {
          showSuccess('La prefactura ha sido validada correctamente', {
            title: 'Validación exitosa'
          });
        }
      } else {
        await simulateProgress(100, 'Validación completada con errores');
        
        showError('La prefactura contiene errores que deben corregirse', {
          title: 'Validación fallida'
        });
      }
    } catch (error) {
      console.error('Error en la validación:', error);
      setValidationProgress(100);
      setValidationStep('Error en la validación');
      
      showError('Ha ocurrido un error durante la validación', {
        title: 'Error inesperado'
      });
    }
  };

  // Función auxiliar para simular progreso
  const simulateProgress = async (targetProgress, step) => {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        setValidationProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(interval);
            setValidationStep(step);
            resolve();
            return targetProgress;
          }
          return prev + 2;
        });
      }, 50);
    });
  };

  // Validación detallada de servicios
  const validateServices = async (services) => {
    // Aquí implementarías validaciones específicas para cada servicio
    // Por ahora simularemos validaciones aleatorias
    return services.map(service => {
      const hasAuthorization = !!service.authorization;
      const hasDiagnosis = !!service.diagnosis;
      const hasValidCups = !!service.cupsCode && service.cupsCode.length >= 6;
      
      const errors = [];
      const warnings = [];
      
      if (!hasValidCups) {
        errors.push('Código CUPS no válido');
      }
      
      if (!hasAuthorization) {
        warnings.push('Falta número de autorización');
      }
      
      if (!hasDiagnosis) {
        warnings.push('Falta diagnóstico');
      }
      
      return {
        serviceId: service._id,
        patientId: service.patientId,
        patientName: service.patientName || 'Paciente sin nombre',
        cupsCode: service.cupsCode,
        serviceDate: service.serviceDate,
        value: service.value,
        errors,
        warnings,
        status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid'
      };
    });
  };

  // Manejar la aprobación de la prefactura
  const handleApprove = () => {
    if (validationResult?.isValid) {
      showSuccess('Prefactura aprobada correctamente');
      if (onValidate) {
        onValidate({
          status: 'approved',
          validationResult,
          validationDetails
        });
      }
    } else {
      showError('No se puede aprobar una prefactura con errores');
    }
  };

  // Manejar el rechazo de la prefactura
  const handleReject = () => {
    showWarning('Prefactura rechazada');
    if (onValidate) {
      onValidate({
        status: 'rejected',
        validationResult,
        validationDetails
      });
    }
  };

  // Mostrar detalles de un servicio específico
  const handleViewDetails = (detail) => {
    setSelectedDetail(detail);
    setShowDetailsDialog(true);
  };

  // Información general de la prefactura
  const renderPreBillInfo = () => {
    if (!preBill) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información de la Prefactura
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Empresa
                  </Typography>
                  <Typography variant="body1">
                    {preBill.companyName || 'No especificada'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contrato
                  </Typography>
                  <Typography variant="body1">
                    {preBill.contractName || 'No especificado'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Período
                  </Typography>
                  <Typography variant="body1">
                    {preBill.startDate ? formatDate(preBill.startDate) : 'N/A'} - 
                    {preBill.endDate ? formatDate(preBill.endDate) : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Servicios
                  </Typography>
                  <Typography variant="body1">
                    {preBill.services?.length || 0} servicios
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Valor Total
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(preBill.totalValue || 0)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip 
                    label={preBill.status || 'Pendiente'} 
                    color={preBill.status === 'approved' ? 'success' : 
                           preBill.status === 'rejected' ? 'error' : 'warning'}
                    size="small"
                  />
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Tabla de servicios con su estado de validación
  const renderServicesTable = () => {
    if (!validationDetails.length) return null;

    return (
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Estado</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>CUPS</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validationDetails.map((detail) => (
              <TableRow 
                key={detail.serviceId}
                sx={{
                  bgcolor: detail.status === 'error' ? 'error.lighter' : 
                           detail.status === 'warning' ? 'warning.lighter' : 'inherit'
                }}
              >
                <TableCell>
                  {detail.status === 'valid' ? (
                    <CheckCircle color="success" fontSize="small" />
                  ) : detail.status === 'warning' ? (
                    <Warning color="warning" fontSize="small" />
                  ) : (
                    <Error color="error" fontSize="small" />
                  )}
                </TableCell>
                <TableCell>{detail.patientName}</TableCell>
                <TableCell>{detail.cupsCode}</TableCell>
                <TableCell>{formatDate(detail.serviceDate)}</TableCell>
                <TableCell align="right">{formatCurrency(detail.value)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver detalles">
                    <IconButton size="small" onClick={() => handleViewDetails(detail)}>
                      <InfoOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Dialog para mostrar detalles de un servicio
  const renderDetailDialog = () => {
    if (!selectedDetail) return null;

    return (
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Servicio
          <IconButton
            aria-label="close"
            onClick={() => setShowDetailsDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Paciente
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedDetail.patientName}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Código CUPS
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedDetail.cupsCode}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Fecha de Servicio
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDate(selectedDetail.serviceDate)}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Valor
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatCurrency(selectedDetail.value)}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              {selectedDetail.errors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error.main">
                    Errores
                  </Typography>
                  <List dense sx={{ bgcolor: 'error.lighter', borderRadius: 1, p: 1 }}>
                    {selectedDetail.errors.map((error, index) => (
                      <ListItem key={`detail-error-${index}`}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <Error color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedDetail.warnings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="warning.main">
                    Advertencias
                  </Typography>
                  <List dense sx={{ bgcolor: 'warning.lighter', borderRadius: 1, p: 1 }}>
                    {selectedDetail.warnings.map((warning, index) => (
                      <ListItem key={`detail-warning-${index}`}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <Warning color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedDetail.errors.length === 0 && selectedDetail.warnings.length === 0 && (
                <Alert severity="success">
                  <AlertTitle>Servicio Válido</AlertTitle>
                  Este servicio cumple con todos los criterios de validación.
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Validación de Prefactura
      </Typography>

      {/* Progreso de la validación */}
      {validationProgress < 100 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {validationStep}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {validationProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={validationProgress} 
            sx={{ height: 8, borderRadius: 5 }}
          />
        </Box>
      )}

      {/* Información de la prefactura */}
      {renderPreBillInfo()}

      {/* Resultado de la validación */}
      {validationResult && (
        <ValidationSummary validationResult={validationResult} />
      )}

      {/* Tabla de servicios con validación */}
      {renderServicesTable()}

      {/* Dialog de detalles */}
      {renderDetailDialog()}

      {/* Botones de acción */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="error"
          startIcon={<Close />}
          onClick={onCancel || handleReject}
        >
          Cancelar
        </Button>
        
        <Button 
          variant="outlined"
          startIcon={<Refresh />}
          onClick={validatePreBill}
          disabled={validationProgress < 100}
        >
          Revalidar
        </Button>
        
        <Button 
          variant="contained" 
          color="error"
          startIcon={<Delete />}
          onClick={handleReject}
          disabled={validationProgress < 100}
        >
          Rechazar
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<VerifiedUser />}
          onClick={handleApprove}
          disabled={validationProgress < 100 || (validationResult && !validationResult.isValid)}
        >
          Aprobar
        </Button>
      </Box>
    </Box>
  );
};

export default ValidacionPrefactura;