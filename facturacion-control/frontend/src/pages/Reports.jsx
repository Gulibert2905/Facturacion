// src/pages/Reports.jsx - Versión mejorada y corregida
import React, { useState, useEffect, useMemo } from 'react';
import exportService from '../components/services/exportService';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import { useNotification } from '../contexts/NotificationContext';
import {
  Box,
  Alert,
  Paper,
  Grid,
  Typography,
  Button,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
  MenuItem,
  CircularProgress
} from '@mui/material';
//import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { Download, Send,PictureAsPdf, TableChart  } from '@mui/icons-material';

// Importar nuestros nuevos componentes y servicios
import PaginatedTable from '../components/PaginatedTable';
import useApi from '../hooks/useApi';
import { apiService } from '../components/services/apiService';
//import { validationService } from '../services/validationService';
import customValidationService from '../components/services/customValidationService';


// Componente principal de Reportes mejorado
function Reports() {
  // Estado para filtros
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    companies: [],
    contracts: [],
    municipalities: [],
    regimens: []
  });

  // Estados para las opciones de selección
  const [selectedColumns, setSelectedColumns] = useState([
    'documentNumber', 'fullName', 'serviceDate', 'cupsCode', 'value'
  ]);

  // Estado para datos del reporte
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [contractsData, setContractsData] = useState([]);
  const { showSuccess, showInfo, showWarning, showError } = useNotification();
  const [savedFilters, setSavedFilters] = useState(() => {
  const saved = localStorage.getItem('reportSavedFilters');
  return saved ? JSON.parse(saved) : [];
});
 


  // Estado para el menú de exportación
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Recuperar opciones usando nuestro hook de API
  const { 
    data: companies,
    
  } = useApi('/companies');
  
  const { 
    data: municipalities,
     
  } = useApi('/reports/municipalities');

  // Para los contratos, necesitamos manejarlos especialmente basados en las empresas seleccionadas
  const { 
    fetchData: fetchContracts,
    
  } = useApi('/contracts', { fetchOnMount: false });

  // Efectos para cargar datos relacionados
  useEffect(() => {
    const loadContracts = async () => {
      // Si "Todas" está seleccionada o no hay empresas seleccionadas, cargar todos los contratos
      if (filters.companies.includes('all') || filters.companies.length === 0) {
        const contractsResult = await fetchContracts();
        setContractsData(contractsResult || []);
        return;
      }
      
      // Si hay empresas específicas seleccionadas, cargar sus contratos
      try {
        // Crear un array de promesas para cargar contratos de cada empresa
        const contractPromises = filters.companies.map(companyId => {
          return apiService.get(`/companies/${companyId}/contracts`)
            .catch(err => {
              console.warn(`Error cargando contratos para empresa ${companyId}:`, err);
              return []; // Retornar array vacío en caso de error
            });
        });
        
        // Esperar a que todas las promesas se resuelvan
        const results = await Promise.all(contractPromises);
        
        // Combinar todos los contratos en un solo array
        const allContracts = results.flat();
        
        // Actualizar el estado de contratos
        setContractsData(allContracts);
      } catch (error) {
        console.error('Error cargando contratos:', error);
        setError('Error al cargar los contratos. Por favor intente nuevamente.');
      }
    };
    
    if (filters.companies.length > 0) {
      loadContracts();
    }
  }, [filters.companies, fetchContracts, setError]);

  // Constantes y conversiones para opciones
  const regimensData = useMemo(() => ['Subsidiado', 'Contributivo'], []);
  
  // Memorización de opciones formateadas
  const formattedOptions = useMemo(() => {
    return {
      companies: [
        { _id: 'all', name: 'Todas' },
        ...(companies || [])
      ],
      municipalities: [
        { value: 'all', label: 'Todos' },
        ...(municipalities || []).map(m => ({ value: m, label: m }))
      ],
      regimens: [
        { value: 'all', label: 'Todos' },
        ...regimensData.map(r => ({ value: r, label: r }))
      ],
      contracts: [
        { _id: 'all', name: 'Todos' },
        ...(contractsData || [])
      ]
    };
  }, [companies, municipalities, contractsData, regimensData]);

  // Función para manejar cambios en filtros
 // Configuración de los filtros
const filterConfig = [
  {
    type: 'dateRange',
    field: 'dateRange',
    label: 'Fecha de Servicio',
    width: 6 // Ancho en el grid (12 columnas total)
  },
  {
    type: 'select',
    field: 'companies',
    label: 'Empresas',
    options: [
      { value: 'all', label: 'Todas' },
      ...(companies || []).map(company => ({
        value: company._id,
        label: company.name
      }))
    ],
    multiple: true,
    width: 6
  },
  {
    type: 'select',
    field: 'contracts',
    label: 'Contratos',
    options: [
      { value: 'all', label: 'Todos' },
      ...(contractsData || []).map(contract => ({
        value: contract._id,
        label: contract.name
      }))
    ],
    multiple: true,
    width: 6
  },
  {
    type: 'select',
    field: 'municipalities',
    label: 'Municipios',
    options: [
      { value: 'all', label: 'Todos' },
      ...(municipalities || []).map(m => ({
        value: m,
        label: m
      }))
    ],
    multiple: true,
    width: 6
  },
  {
    type: 'select',
    field: 'regimens',
    label: 'Régimen',
    options: [
      { value: 'all', label: 'Todos' },
      ...regimensData.map(r => ({
        value: r,
        label: r
      }))
    ],
    multiple: true,
    width: 6
  }
];

// Manejo de filtros
const handleFilterChange = (newFilters) => {
  console.log('🔍 Filtros recibidos en handleFilterChange:', newFilters);
  
  // Crear una copia de los filtros para evitar mutación
  const processedFilters = { ...newFilters };
  
  // Lógica específica para manejar dateRange
  if (newFilters.dateRange) {
    let startDate = null;
    let endDate = null;
    
    // Manejar diferentes formatos de fecha que pueden venir de AdvancedFilters
    if (newFilters.dateRange.from) {
      try {
        const fromDate = new Date(newFilters.dateRange.from);
        // Asegurar que la fecha es válida y convertir a formato ISO (solo fecha)
        if (!isNaN(fromDate.getTime())) {
          startDate = fromDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error procesando fecha from:', error);
      }
    }
    
    if (newFilters.dateRange.to) {
      try {
        const toDate = new Date(newFilters.dateRange.to);
        // Asegurar que la fecha es válida y convertir a formato ISO (solo fecha)
        if (!isNaN(toDate.getTime())) {
          endDate = toDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error procesando fecha to:', error);
      }
    }
    
    processedFilters.startDate = startDate;
    processedFilters.endDate = endDate;
    
    // Eliminar dateRange ya procesado
    delete processedFilters.dateRange;
    
    console.log('📅 Fechas procesadas:', { startDate, endDate });
  }
  
  console.log('✅ Filtros finales procesados:', processedFilters);
  setFilters(processedFilters);
};

// Convertir filtros actuales al formato esperado por AdvancedFilters
const getInitialFilters = () => {
  return {
    dateRange: {
      from: filters.startDate,
      to: filters.endDate
    },
    companies: filters.companies || [],
    contracts: filters.contracts || [],
    municipalities: filters.municipalities || [],
    regimens: filters.regimens || []
  };
};

// Guardar un filtro
const handleSaveFilter = (newFilter) => {
  const updatedFilters = [...savedFilters, newFilter];
  setSavedFilters(updatedFilters);
  localStorage.setItem('reportSavedFilters', JSON.stringify(updatedFilters));
  
  showSuccess('Filtro guardado correctamente', {
    title: 'Filtro guardado'
  });
};

// Eliminar un filtro guardado
const handleDeleteFilter = (id) => {
  const updatedFilters = savedFilters.filter(filter => filter.id !== id);
  setSavedFilters(updatedFilters);
  localStorage.setItem('reportSavedFilters', JSON.stringify(updatedFilters));
  
  showInfo('Filtro eliminado', {
    title: 'Filtro eliminado'
  });
};

// Aplicar un filtro guardado
const handleApplyFilter = (savedFilter) => {
  if (savedFilter && savedFilter.filters) {
    // Adaptar formato si es necesario
    const adaptedFilters = { ...savedFilter.filters };
    
    // Manejar dateRange
    if (adaptedFilters.dateRange) {
      adaptedFilters.startDate = adaptedFilters.dateRange.from;
      adaptedFilters.endDate = adaptedFilters.dateRange.to;
      delete adaptedFilters.dateRange;
    }
    
    setFilters(adaptedFilters);
    
    showInfo(`Filtro "${savedFilter.name}" aplicado`, {
      title: 'Filtro aplicado'
    });
  }
};

  // Función para manejar selección/deselección de columnas
  const handleColumnToggle = (columnId) => {
    setSelectedColumns(prev => 
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  // Función para generar reporte
  const generateReport = async () => {
  setLoading(true);
  setError(null);

  console.log('🚀 Iniciando generación de reporte con filtros:', filters);

  try {
    // Validar fechas obligatorias PRIMERO
    if (!filters.startDate || !filters.endDate) {
      const errorMsg = 'Las fechas de inicio y fin son obligatorias para generar el reporte';
      setError(errorMsg);
      showError(errorMsg, { title: 'Fechas requeridas' });
      setLoading(false);
      return;
    }

    // Validar que las fechas sean válidas
    const startDateObj = new Date(filters.startDate);
    const endDateObj = new Date(filters.endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      const errorMsg = 'Las fechas proporcionadas no son válidas';
      setError(errorMsg);
      showError(errorMsg, { title: 'Fechas inválidas' });
      setLoading(false);
      return;
    }

    // Validar que la fecha de inicio no sea mayor que la de fin
    if (startDateObj > endDateObj) {
      const errorMsg = 'La fecha de inicio no puede ser mayor que la fecha de fin';
      setError(errorMsg);
      showError(errorMsg, { title: 'Rango de fechas inválido' });
      setLoading(false);
      return;
    }

    // Preparar los filtros para la API con manejo especial de arrays vacíos y "all"
    const apiFilters = {
      // Fechas ya validadas en formato ISO
      startDate: filters.startDate,
      endDate: filters.endDate,
      
      // Empresas: si incluye 'all' o está vacío, enviar array vacío
      companies: (filters.companies?.includes('all') || !filters.companies?.length) 
        ? [] 
        : filters.companies.filter(id => id !== 'all'),
      
      // Contratos: mismo manejo
      contracts: (filters.contracts?.includes('all') || !filters.contracts?.length) 
        ? [] 
        : filters.contracts.filter(id => id !== 'all'),
      
      // Municipios: mismo manejo
      municipalities: (filters.municipalities?.includes('all') || !filters.municipalities?.length) 
        ? [] 
        : filters.municipalities.filter(id => id !== 'all'),
      
      // Regímenes: mismo manejo
      regimens: (filters.regimens?.includes('all') || !filters.regimens?.length) 
        ? [] 
        : filters.regimens.filter(id => id !== 'all')
    };

    console.log('📤 Filtros enviados a la API:', apiFilters);

    // Validación adicional usando el servicio personalizado
    const validationResult = customValidationService.validateRipsGeneration(apiFilters, filters);
    if (!validationResult.isValid) {
      const errorMsg = validationResult.errors.join(', ');
      setError(errorMsg);
      showError(errorMsg, { title: 'Validación fallida' });
      setLoading(false);
      return;
    }

    // Mostrar indicador de progreso
    const progressNotification = showInfo('Generando reporte...', {
      title: 'Procesando',
      processStatus: 'processing'
    });

    // Realizar la solicitud a la API
    const response = await apiService.post('/reports/generate', {
      filters: apiFilters,
      columns: selectedColumns
    });

    console.log('📥 Respuesta de la API:', response);

    // Procesar la respuesta
    if (response?.success) {
      const data = response.data || [];
      const totals = response.totals || null;
      
      setReportData(data);
      setReportSummary(totals);

      // Actualizar notificación de progreso
      if (data.length === 0) {
        showWarning('No se encontraron datos para los filtros seleccionados', {
          id: progressNotification,
          title: 'Sin resultados',
          processStatus: 'completed'
        });
      } else {
        showSuccess(`Reporte generado exitosamente con ${data.length} registros`, {
          id: progressNotification,
          title: 'Reporte completado',
          processStatus: 'completed'
        });
      }
    } else {
      throw new Error(response?.message || 'Error al generar reporte');
    }

  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    
    let errorMessage = 'Error al generar el reporte. Por favor intente nuevamente.';
    
    // Manejar diferentes tipos de errores
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    showError(errorMessage, { 
      title: 'Error de generación',
      description: 'Verifique los filtros y su conexión a internet'
    });
  } finally {
    setLoading(false);
  }
};

  // Manejadores para el menú de exportación
const handleExportClick = (event) => {
  setExportMenuAnchor(event.currentTarget);
};

const handleExportClose = () => {
  setExportMenuAnchor(null);
};

// Funciones de exportación para diferentes formatos
const handleExportExcel = async () => {
  handleExportClose();
  
  try {
    // Verificar que hay datos para exportar
    if (!reportData || reportData.length === 0) {
      showWarning('No hay datos para exportar', { 
        title: 'Exportación vacía'
      });
      return;
    }
    
    // Iniciar la exportación
    const notificationId = showInfo('Preparando exportación a Excel...', {
      title: 'Exportando',
      processStatus: 'processing'
    });
    
    const result = await exportService.exportToExcel({
      apiEndpoint: '/reports/export',
      filters,
      columns: selectedColumns.map(id => ({
        field: id,
        label: getColumnLabel(id)
      })),
      data: reportData,
      fileName: 'reporte_servicios'
    });
    
    if (result.success) {
      showSuccess('Reporte exportado correctamente a Excel', {
        id: notificationId,
        processStatus: 'completed',
        title: 'Exportación completada'
      });
    } else {
      showError(`Error en la exportación: ${result.error}`, {
        id: notificationId,
        processStatus: 'error',
        title: 'Error de exportación'
      });
    }
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    showError(`Error: ${error.message || 'Error desconocido'}`, { 
      title: 'Error de exportación'
    });
  }
};

const handleExportPDF = async () => {
  handleExportClose();
  
  try {
    // Verificar que hay datos
    if (!reportData || reportData.length === 0) {
      showWarning('No hay datos para exportar', { 
        title: 'Exportación vacía'
      });
      return;
    }
    
    // Iniciar la exportación
    const notificationId = showInfo('Generando PDF...', {
      title: 'Exportando',
      processStatus: 'processing'
    });
    
    // Construir título del reporte
    let reportTitle = 'Reporte de Servicios';
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate).toLocaleDateString();
      const end = new Date(filters.endDate).toLocaleDateString();
      reportTitle += ` (${start} - ${end})`;
    }
    
    // Opciones específicas para PDF
    const result = await exportService.exportToPDF({
      data: reportData,
      columns: selectedColumns.map(id => ({
        field: id,
        label: getColumnLabel(id),
        type: id === 'value' ? 'currency' : id.includes('date') ? 'date' : 'text'
      })),
      title: reportTitle,
      subtitle: filters.companies.includes('all') ? 
        'Todas las empresas' : 
        `Empresa: ${companies?.find(c => c._id === filters.companies[0])?.name || ''}`,
      fileName: 'reporte_servicios',
      orientation: 'landscape'
    });
    
    if (result.success) {
      showSuccess('Reporte exportado correctamente a PDF', {
        id: notificationId,
        processStatus: 'completed',
        title: 'Exportación completada'
      });
    } else {
      showError(`Error en la exportación: ${result.error}`, {
        id: notificationId,
        processStatus: 'error',
        title: 'Error de exportación'
      });
    }
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    showError(`Error: ${error.message || 'Error desconocido'}`, { 
      title: 'Error de exportación'
    });
  }
};

const handleExportCSV = async () => {
  handleExportClose();
  
  try {
    // Verificar que hay datos
    if (!reportData || reportData.length === 0) {
      showWarning('No hay datos para exportar', { 
        title: 'Exportación vacía'
      });
      return;
    }
    
    // Iniciar la exportación
    const notificationId = showInfo('Generando CSV...', {
      title: 'Exportando',
      processStatus: 'processing'
    });
    
    const result = exportService.exportToCSV({
      data: reportData,
      columns: selectedColumns.map(id => ({
        field: id,
        label: getColumnLabel(id),
        type: id === 'value' ? 'currency' : id.includes('date') ? 'date' : 'text'
      })),
      fileName: 'reporte_servicios'
    });
    
    if (result.success) {
      showSuccess('Reporte exportado correctamente a CSV', {
        id: notificationId,
        processStatus: 'completed',
        title: 'Exportación completada'
      });
    } else {
      showError(`Error en la exportación: ${result.error}`, {
        id: notificationId,
        processStatus: 'error',
        title: 'Error de exportación'
      });
    }
  } catch (error) {
    console.error('Error exportando a CSV:', error);
    showError(`Error: ${error.message || 'Error desconocido'}`, { 
      title: 'Error de exportación'
    });
  }
};

  // Función helper para obtener etiquetas de columnas
  const getColumnLabel = (columnId) => {
    const labels = {
      documentNumber: 'Documento',
      fullName: 'Nombre',
      serviceDate: 'Fecha Servicio',
      cupsCode: 'CUPS',
      value: 'Valor',
      authorization: 'Autorización',
      diagnosis: 'Diagnóstico',
      regimen: 'Régimen',
      municipality: 'Municipio',
      department: 'Departamento',
      companyName: 'Empresa',
      contractName: 'Contrato'
    };
    return labels[columnId] || columnId;
  };

  // Definir las columnas disponibles para la tabla
  const availableColumns = [
    { id: 'documentNumber', label: 'Documento' },
    { id: 'fullName', label: 'Nombre' },
    { id: 'serviceDate', label: 'Fecha Servicio' },
    { id: 'cupsCode', label: 'CUPS' },
    { id: 'value', label: 'Valor' },
    { id: 'authorization', label: 'Autorización' },
    { id: 'diagnosis', label: 'Diagnóstico' },
    { id: 'regimen', label: 'Régimen' },
    { id: 'municipality', label: 'Municipio' },
    { id: 'department', label: 'Departamento' },
    { id: 'companyName', label: 'Empresa' },
    { id: 'contractName', label: 'Contrato' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reportes Personalizados
        </Typography>

        <AdvancedFilters
          filterConfig={filterConfig}
          initialFilters={getInitialFilters()}
          onFilterChange={handleFilterChange}
          onSaveFilter={handleSaveFilter}
          onDeleteFilter={handleDeleteFilter}
          onApplyFilter={handleApplyFilter}
          savedFilters={savedFilters}
          title="Filtros de Reportes"
        />

        {/* Sección de Columnas */}
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Campos a Incluir
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableColumns.map(column => (
              <Chip
                key={column.id}
                label={column.label}
                color={selectedColumns.includes(column.id) ? "primary" : "default"}
                onClick={() => handleColumnToggle(column.id)}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Paper>

        {/* Mensaje de Error */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Botones de Acción */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generar Reporte'}
          </Button>
          <Button
  variant="outlined"
  startIcon={<Download />}
  onClick={handleExportClick}
  disabled={loading}
>
  Exportar
</Button>
<Menu
  anchorEl={exportMenuAnchor}
  open={Boolean(exportMenuAnchor)}
  onClose={handleExportClose}
>
  <MenuItem onClick={handleExportExcel} disabled={!reportData || reportData.length === 0}>
    <ListItemIcon>
      <TableChart fontSize="small" />
    </ListItemIcon>
    <ListItemText>Excel</ListItemText>
  </MenuItem>
  <MenuItem onClick={handleExportPDF} disabled={!reportData || reportData.length === 0}>
    <ListItemIcon>
      <PictureAsPdf fontSize="small" />
    </ListItemIcon>
    <ListItemText>PDF</ListItemText>
  </MenuItem>
  <MenuItem onClick={handleExportCSV} disabled={!reportData || reportData.length === 0}>
    <ListItemIcon>
      <TableChart fontSize="small" />
    </ListItemIcon>
    <ListItemText>CSV</ListItemText>
  </MenuItem>
</Menu>
          <Button
            variant="outlined"
            startIcon={<Send />}
            disabled={loading || reportData.length === 0}
          >
            Enviar por Correo
          </Button>
        </Box>

        {/* Resumen del reporte */}
        {reportSummary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Servicios
                  </Typography>
                  <Typography variant="h4">
                    {reportSummary.totalServices}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Valor Total
                  </Typography>
                  <Typography variant="h4">
                    ${reportSummary.totalValue.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Promedio por Servicio
                  </Typography>
                  <Typography variant="h4">
                    ${(reportSummary.totalValue / reportSummary.totalServices).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabla de Resultados */}
        {reportData.length > 0 ? (
          <PaginatedTable
            columns={availableColumns.filter(col => 
              selectedColumns.includes(col.id)
            ).map(col => ({
              field: col.id,
              headerName: col.label,
              sortable: true,
              filterable: true,
              width: col.id === 'fullName' ? 200 : undefined,
              renderCell: (value, row) => {
                // Formateo especial para valores monetarios
                if (col.id === 'value') {
                  return `$${value.toLocaleString()}`;
                }
                // Formateo para fechas
                if (col.id === 'serviceDate' && value) {
                  return new Date(value).toLocaleDateString();
                }
                return value;
              }
            }))}
            data={reportData}
            serverSide={false}
            onRowClick={(row) => console.log('Fila seleccionada:', row)}
            
          />
        ) : !loading && (
          <Paper elevation={1} sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No hay datos para mostrar. Seleccione los filtros y genere el reporte.
            </Typography>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default Reports;