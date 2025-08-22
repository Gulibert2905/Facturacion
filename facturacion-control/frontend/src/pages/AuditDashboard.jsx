// src/pages/AuditDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import { useAudit } from '../contexts/AuditContext';
import AuditFilterPanel from '../components/services/audit/AuditFilterPanel';
import AuditResultsTable from '../components/audit/AuditResultsTable';
import ServiceVerification from '../components/audit/ServiceVerification';
import ContractValidation from '../components/audit/ContractValidation';
import InconsistencyDetection from '../components/audit/InconsistencyDetection';
import AuditRulesList from '../components/audit/AuditRulesList';

/**
 * Página principal del Dashboard de Auditoría
 */
const AuditDashboard = () => {
  // Estado global de auditoría
  const {
    params,
    results,
    rules,
    selectedRules,
    stats,
    loading,
    error,
    loadResults,
    loadStats,
    runAudit,
    setParams,
    selectRules,
    exportResults
  } = useAudit();
  
  // Estados locales
  const [startDate, setStartDate] = useState(params.startDate ? new Date(params.startDate) : null);
  const [endDate, setEndDate] = useState(params.endDate ? new Date(params.endDate) : null);
  const [activeTab, setActiveTab] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    if (stats === null) {
      loadStats();
    }
    loadResults();
  }, []);
  
  // Aplicar rango de fechas
  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      setParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    }
  };
  
  // Cambiar pestaña activa
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Ejecutar auditoría
  const handleRunAudit = async () => {
    try {
      await runAudit();
    } catch (error) {
      console.error('Error al ejecutar auditoría:', error);
    }
  };
  
  // Abrir menú
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Cerrar menú
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Exportar resultados
  const handleExport = async (format) => {
    try {
      await exportResults(null, format);
      handleMenuClose();
    } catch (error) {
      console.error('Error al exportar resultados:', error);
    }
  };
  
  // Calcular resumen de hallazgos
  const calculateFindingSummary = () => {
    if (!stats) return null;
    
    return {
      critical: stats.findings?.critical || 0,
      high: stats.findings?.high || 0,
      medium: stats.findings?.medium || 0,
      low: stats.findings?.low || 0,
      info: stats.findings?.info || 0,
      total: stats.findings?.total || 0
    };
  };
  
  const findingSummary = calculateFindingSummary();
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Dashboard de Auditoría</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label="Fecha inicial"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <DatePicker
            label="Fecha final"
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          
          <Button 
            variant="contained" 
            onClick={handleApplyDateRange}
            size="small"
          >
            Aplicar
          </Button>
          
          <IconButton onClick={() => setFiltersOpen(!filtersOpen)} color="primary">
            <FilterListIcon />
          </IconButton>
          
          <LoadingButton
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            loading={loading.audit}
            onClick={handleRunAudit}
          >
            Ejecutar Auditoría
          </LoadingButton>
          
          <IconButton
            color="primary"
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleExport('PDF')}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar a PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport('EXCEL')}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar a Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport('CSV')}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar a CSV</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Configuración</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Historial de auditorías</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Filtros adicionales */}
      {filtersOpen && (
        <AuditFilterPanel 
          rules={rules}
          selectedRules={selectedRules}
          onRuleSelect={selectRules}
          onClose={() => setFiltersOpen(false)}
        />
      )}
      
      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tarjetas de resumen */}
      {findingSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="error.main" gutterBottom>
                  Críticos
                </Typography>
                <Typography variant="h4" color="error.main">
                  {findingSummary.critical}
                </Typography>
                <ErrorIcon color="error" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="warning.main" gutterBottom>
                  Altos
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {findingSummary.high}
                </Typography>
                <WarningIcon color="warning" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="primary.main" gutterBottom>
                  Medios
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {findingSummary.medium}
                </Typography>
                <InfoIcon color="primary" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="info.main" gutterBottom>
                  Bajos
                </Typography>
                <Typography variant="h4" color="info.main">
                  {findingSummary.low}
                </Typography>
                <InfoIcon color="info" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="success.main" gutterBottom>
                  Informativos
                </Typography>
                <Typography variant="h4" color="success.main">
                  {findingSummary.info}
                </Typography>
                <CheckCircleIcon color="success" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', bgcolor: 'primary.lighter' }}>
                <Typography variant="overline" color="primary.dark" gutterBottom>
                  Total Hallazgos
                </Typography>
                <Typography variant="h4" color="primary.dark">
                  {findingSummary.total}
                </Typography>
                <Chip 
                  label={stats?.auditDate ? new Date(stats.auditDate).toLocaleDateString() : 'Sin auditoría'} 
                  size="small" 
                  variant="outlined"
                  color="primary"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Pestañas para diferentes vistas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Resultados" />
          <Tab label="Verificación de Servicios" />
          <Tab label="Validación de Contratos" />
          <Tab label="Detección de Inconsistencias" />
          <Tab label="Reglas de Auditoría" />
        </Tabs>
      </Paper>
      
      {/* Contenido según pestaña seleccionada */}
      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && (
          <AuditResultsTable 
            results={results} 
            loading={loading.results}
          />
        )}
        
        {activeTab === 1 && (
          <ServiceVerification />
        )}
        
        {activeTab === 2 && (
          <ContractValidation />
        )}
        
        {activeTab === 3 && (
          <InconsistencyDetection />
        )}
        
        {activeTab === 4 && (
          <AuditRulesList 
            rules={rules} 
            selectedRules={selectedRules}
            onRuleSelect={selectRules}
          />
        )}
      </Box>
    </Box>
  );
};

export default AuditDashboard;