// src/pages/AdvancedReports.jsx - Código completo
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  GetApp,
  Settings,
  Add,
  Edit,
  CheckCircle,
  CloudDownload
} from '@mui/icons-material';

const AdvancedReports = () => {
  // Estados principales
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPrefacturas, setSelectedPrefacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  
  // Estados para gestión de plantillas
  const [templates, setTemplates] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Datos de API
  const [companies, setCompanies] = useState([]);
  const [prefacturas, setPrefacturas] = useState([]);
  
  // Estado para nueva plantilla
  const [newTemplate, setNewTemplate] = useState({
    nombrePlantilla: '',
    empresaId: '',
    tipoExportacion: 'CONTABLE',
    configuracionContable: {
      empresa: '',
      tipoDocumento: 'FV',
      prefijo: '',
      terceroInterno: '',
      terceroExterno: '',
      formaPago: 'Credito',
      diasVencimiento: 30,
      unidadMedida: 'Und.',
      iva: 0,
      tipoOperacion: 'SS-CUFE',
      tipoCobroModerador: 'No aplica',
      coberturaPlan: 'Plan de beneficios en salud financiados con UPC',
      modalidadPago: 'Pago por evento.'
    },
    numeracionConfig: {
      numeroActual: 1000,
      incremento: 1
    }
  });

  // Configuración de pasos
  const steps = [
    'Seleccionar Tipo',
    'Configurar Plantilla',
    'Seleccionar Datos',
    'Revisar y Exportar'
  ];

  // Tipos de reportes
  const reportTypes = [
    {
      id: 'CONTABLE',
      name: 'Exportación Contable',
      description: 'Excel para software contable con 3 hojas',
      icon: <GetApp />,
      color: 'primary'
    },
    {
      id: 'CONTRATO_MUNICIPIO',
      name: 'Reporte por Municipio',
      description: 'Análisis por contrato y municipio',
      icon: <Settings />,
      color: 'secondary'
    },
    {
      id: 'PERSONALIZADO',
      name: 'Reporte Personalizado',
      description: 'Campos y formato personalizado',
      icon: <Edit />,
      color: 'success'
    }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [companiesRes, templatesRes, prefacturasRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/reports/templates'),
        fetch('/api/prebills?status=pending')
      ]);
      
      setCompanies(await companiesRes.json());
      setTemplates(await templatesRes.json());
      setPrefacturas(await prefacturasRes.json());
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Manejar guardado de plantilla
  const handleSaveTemplate = async () => {
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate ? 
        `/api/reports/templates/${editingTemplate._id}` : 
        '/api/reports/templates';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        setShowTemplateDialog(false);
        setEditingTemplate(null);
        loadInitialData();
        alert('Plantilla guardada exitosamente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar plantilla');
    }
  };

  // Componente del diálogo de plantillas
  const TemplateDialog = () => (
    <Dialog 
      open={showTemplateDialog} 
      onClose={() => setShowTemplateDialog(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              Información Básica
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de la Plantilla"
              value={newTemplate.nombrePlantilla}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                nombrePlantilla: e.target.value
              })}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={newTemplate.empresaId}
                label="Empresa"
                onChange={(e) => setNewTemplate({
                  ...newTemplate,
                  empresaId: e.target.value
                })}
              >
                {companies.map(company => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Configuración contable */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Configuración para Software Contable
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nombre Empresa en Factura"
              value={newTemplate.configuracionContable.empresa}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  empresa: e.target.value
                }
              })}
              placeholder="CENTRO MÉDICO INTEGRAL DEL CARIBE."
              helperText="Nombre completo como aparece en el software contable"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Tipo Doc"
              value={newTemplate.configuracionContable.tipoDocumento}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  tipoDocumento: e.target.value
                }
              })}
              placeholder="FV"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Prefijo"
              value={newTemplate.configuracionContable.prefijo}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  prefijo: e.target.value
                }
              })}
              placeholder="CMDI"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tercero Interno (NIT Empresa)"
              value={newTemplate.configuracionContable.terceroInterno}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  terceroInterno: e.target.value
                }
              })}
              placeholder="1065597040"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tercero Externo (Código EPS)"
              value={newTemplate.configuracionContable.terceroExterno}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  terceroExterno: e.target.value
                }
              })}
              placeholder="901543211"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Forma de Pago</InputLabel>
              <Select
                value={newTemplate.configuracionContable.formaPago}
                label="Forma de Pago"
                onChange={(e) => setNewTemplate({
                  ...newTemplate,
                  configuracionContable: {
                    ...newTemplate.configuracionContable,
                    formaPago: e.target.value
                  }
                })}
              >
                <MenuItem value="Credito">Crédito</MenuItem>
                <MenuItem value="Contado">Contado</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Días Vencimiento"
              value={newTemplate.configuracionContable.diasVencimiento}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  diasVencimiento: parseInt(e.target.value)
                }
              })}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Unidad de Medida"
              value={newTemplate.configuracionContable.unidadMedida}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                configuracionContable: {
                  ...newTemplate.configuracionContable,
                  unidadMedida: e.target.value
                }
              })}
            />
          </Grid>

          {/* Numeración */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Numeración de Facturas
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Número Inicial"
              value={newTemplate.numeracionConfig.numeroActual}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                numeracionConfig: {
                  ...newTemplate.numeracionConfig,
                  numeroActual: parseInt(e.target.value)
                }
              })}
              helperText="Próximo número de factura a usar"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Incremento"
              value={newTemplate.numeracionConfig.incremento}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                numeracionConfig: {
                  ...newTemplate.numeracionConfig,
                  incremento: parseInt(e.target.value)
                }
              })}
              helperText="Incremento por cada factura"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowTemplateDialog(false)}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSaveTemplate}
          disabled={!newTemplate.nombrePlantilla || !newTemplate.empresaId}
        >
          {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Navegación del wizard
  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);
  const handleReset = () => {
    setActiveStep(0);
    setSelectedReportType('');
    setSelectedTemplate('');
    setSelectedPrefacturas([]);
  };

  // Paso 1: Seleccionar tipo
  const StepSelectType = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Selecciona el Tipo de Reporte
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {reportTypes.map((type) => (
          <Grid item xs={12} md={4} key={type.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedReportType === type.id ? 3 : 1,
                borderColor: selectedReportType === type.id ? 
                  `${type.color}.main` : 'grey.300',
                transition: 'all 0.3s',
                '&:hover': { 
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}
              onClick={() => setSelectedReportType(type.id)}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ color: `${type.color}.main`, mb: 2 }}>
                  {React.cloneElement(type.icon, { fontSize: 'large' })}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {type.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {type.description}
                </Typography>
                {selectedReportType === type.id && (
                  <CheckCircle color={type.color} sx={{ fontSize: 32 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Paso 2: Configurar plantilla
  const StepConfigureTemplate = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configurar Plantilla de Exportación
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Tipo seleccionado:</strong> {reportTypes.find(t => t.id === selectedReportType)?.name}
            <br />
            Las plantillas definen el formato específico para tu software contable.
          </Alert>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <FormControl fullWidth required>
            <InputLabel>Plantilla de Exportación</InputLabel>
            <Select
              value={selectedTemplate}
              label="Plantilla de Exportación"
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {templates
                .filter(t => t.tipoExportacion === selectedReportType)
                .map(template => (
                  <MenuItem key={template._id} value={template._id}>
                    <Box>
                      <Typography variant="body1">
                        {template.nombrePlantilla}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.empresaId?.name} - Prefijo: {template.configuracionContable?.prefijo}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              }
              {templates.filter(t => t.tipoExportacion === selectedReportType).length === 0 && (
                <MenuItem disabled>
                  No hay plantillas para este tipo de reporte
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<Add />}
            onClick={() => {
              setNewTemplate({
                ...newTemplate,
                tipoExportacion: selectedReportType
              });
              setShowTemplateDialog(true);
            }}
          >
            Nueva Plantilla
          </Button>
        </Grid>

        {selectedTemplate && (
          <Grid item xs={12}>
            <Alert severity="success">
              <Typography variant="body1" gutterBottom>
                <strong>Plantilla configurada correctamente</strong>
              </Typography>
              El archivo Excel incluirá estas hojas:
              <ul>
                <li><strong>RELACION:</strong> Datos completos de pacientes y servicios</li>
                <li><strong>PLANTILLA:</strong> Formato simplificado para importar</li>
                <li><strong>SECTOR SALUD:</strong> Configuraciones específicas del sector</li>
              </ul>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // Paso 3: Seleccionar prefacturas
  const StepSelectData = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Seleccionar Prefacturas
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Selecciona las prefacturas que deseas incluir en la exportación
        </Typography>
        <Box>
          <Button 
            size="small"
            onClick={() => setSelectedPrefacturas(prefacturas.map(p => p._id))}
            sx={{ mr: 1 }}
          >
            Seleccionar Todas
          </Button>
          <Button 
            size="small"
            onClick={() => setSelectedPrefacturas([])}
          >
            Deseleccionar Todas
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectedPrefacturas.length === prefacturas.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPrefacturas(prefacturas.map(p => p._id));
                    } else {
                      setSelectedPrefacturas([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell><strong>Número</strong></TableCell>
              <TableCell><strong>Empresa</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Servicios</strong></TableCell>
              <TableCell><strong>Valor Total</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prefacturas.map((prefactura) => (
              <TableRow 
                key={prefactura._id}
                hover
                sx={{ 
                  backgroundColor: selectedPrefacturas.includes(prefactura._id) ? 
                    'action.selected' : 'inherit'
                }}
              >
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPrefacturas.includes(prefactura._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPrefacturas([...selectedPrefacturas, prefactura._id]);
                      } else {
                        setSelectedPrefacturas(selectedPrefacturas.filter(id => id !== prefactura._id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{prefactura.number || 'N/A'}</TableCell>
                <TableCell>{prefactura.companyId?.name || 'Sin empresa'}</TableCell>
                <TableCell>
                  {new Date(prefactura.createdAt).toLocaleDateString('es-CO')}
                </TableCell>
                <TableCell>{prefactura.services?.length || 0}</TableCell>
                <TableCell>
                  <strong>${(prefactura.totalValue || 0).toLocaleString('es-CO')}</strong>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={prefactura.status || 'pending'} 
                    color={prefactura.status === 'pending' ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedPrefacturas.length > 0 && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body1">
            <strong>{selectedPrefacturas.length}</strong> prefacturas seleccionadas
          </Typography>
          <Typography variant="body2">
            Total de servicios: {prefacturas
              .filter(p => selectedPrefacturas.includes(p._id))
              .reduce((sum, p) => sum + (p.services?.length || 0), 0)}
          </Typography>
        </Alert>
      )}
    </Box>
  );

  // Paso 4: Revisar y exportar
  const StepReviewExport = () => {
    const selectedTemplateData = templates.find(t => t._id === selectedTemplate);
    const selectedPrefacturasData = prefacturas.filter(p => selectedPrefacturas.includes(p._id));
    const totalValue = selectedPrefacturasData.reduce((sum, p) => sum + (p.totalValue || 0), 0);
    const totalServices = selectedPrefacturasData.reduce((sum, p) => sum + (p.services?.length || 0), 0);
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Resumen de Exportación
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Configuración del Reporte
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                <Typography variant="body1">
                  <strong>{reportTypes.find(t => t.id === selectedReportType)?.name}</strong>
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Plantilla:</Typography>
                <Typography variant="body1">
                  <strong>{selectedTemplateData?.nombrePlantilla}</strong>
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Empresa:</Typography>
                <Typography variant="body1">
                  <strong>{selectedTemplateData?.configuracionContable?.empresa}</strong>
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Prefijo de facturación:</Typography>
                <Typography variant="body1">
                  <strong>{selectedTemplateData?.configuracionContable?.prefijo}</strong>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Datos a Exportar
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Prefacturas:</Typography>
                <Typography variant="h4" color="primary">
                  {selectedPrefacturas.length}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Total servicios:</Typography>
                <Typography variant="h4" color="info.main">
                  {totalServices.toLocaleString('es-CO')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Valor total:</Typography>
                <Typography variant="h4" color="success.main">
                  ${totalValue.toLocaleString('es-CO')}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>El archivo Excel incluirá 3 hojas:</strong>
          </Typography>
          <ul>
            <li><strong>RELACION:</strong> Datos detallados con información completa de pacientes, servicios y configuración contable</li>
            <li><strong>PLANTILLA:</strong> Formato simplificado optimizado para importación directa al software contable</li>
            <li><strong>SECTOR SALUD:</strong> Configuraciones específicas requeridas por el sector salud colombiano</li>
          </ul>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Numeración automática:</strong> Las facturas se numerarán automáticamente desde el número {selectedTemplateData?.numeracionConfig?.numeroActual}
          </Typography>
        </Alert>
      </Box>
    );
  };

  // Función de exportación
  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: selectedReportType,
          prefacturaIds: selectedPrefacturas,
          templateId: selectedTemplate
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Exportacion_${selectedReportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('¡Archivo exportado exitosamente!');
      
    } catch (error) {
      console.error('Error en exportación:', error);
      alert(`Error al generar la exportación: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reportes Avanzados
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Sistema de exportación con plantillas personalizadas para software contable
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 500, mb: 4 }}>
        {activeStep === 0 && <StepSelectType />}
        {activeStep === 1 && <StepConfigureTemplate />}
        {activeStep === 2 && <StepSelectData />}
        {activeStep === 3 && <StepReviewExport />}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          size="large"
        >
          Atrás
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 && (
            <Button 
              variant="outlined"
              onClick={handleReset}
              sx={{ mr: 2 }}
            >
              Reiniciar
            </Button>
          )}
          
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              size="large"
              onClick={handleExport}
              disabled={loading || !selectedTemplate || selectedPrefacturas.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudDownload />}
            >
              {loading ? 'Generando Excel...' : 'Exportar Archivo'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              size="large"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !selectedReportType) ||
                (activeStep === 1 && !selectedTemplate) ||
                (activeStep === 2 && selectedPrefacturas.length === 0)
              }
            >
              Siguiente
            </Button>
          )}
        </Box>
      </Box>

      <TemplateDialog />
    </Box>
  );
};

export default AdvancedReports;