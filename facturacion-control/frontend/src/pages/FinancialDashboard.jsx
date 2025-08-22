// src/pages/FinancialDashboard.jsx
import React, { useState } from 'react';
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
  //InputAdornment,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

import { useFinancial } from '../contexts/FinancialContext';
import FinancialKPICard from '../components/services/financialAnalysis/FinancialKPICard';
import RevenueChart from '../components/services/financialAnalysis/RevenueChart';
import CollectionChart from '../components/services/financialAnalysis/CollectionChart';
import FinancialProjection from '../components/services/financialAnalysis/FinancialProjection';
import ProfitabilityAnalysis from '../components/services/financialAnalysis/ProfitabilityAnalysis';
import AccountsReceivableAging from '../components/services/financialAnalysis/AccountsReceivableAging';

/**
 * Página principal del Dashboard Financiero
 */
const FinancialDashboard = () => {
  // Estado global financiero
  const {
    dateRange,
    kpis,
    billingData,
    collectionData,
    projectionData,
    accountsReceivable,
    profitabilityData,
    loading,
    error,
    setDateRange,
    loadFinancialData,
    loadProjections,
    loadAccountsReceivable,
    loadProfitabilityData,
    exportFinancialReport
  } = useFinancial();
  
  // Estados locales
  const [startDate, setStartDate] = useState(dateRange.startDate ? new Date(dateRange.startDate) : null);
  const [endDate, setEndDate] = useState(dateRange.endDate ? new Date(dateRange.endDate) : null);
  const [activeTab, setActiveTab] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Aplicar cambio de fechas
  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      setDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    }
  };
  
  // Cambiar pestaña activa
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Cargar datos según la pestaña seleccionada
    if (newValue === 1 && projectionData.length === 0) {
      loadProjections();
    } else if (newValue === 2 && accountsReceivable.length === 0) {
      loadAccountsReceivable();
    } else if (newValue === 3 && profitabilityData.length === 0) {
      loadProfitabilityData();
    }
  };
  
  // Exportar dashboard
  const handleExportDashboard = async () => {
    try {
      await exportFinancialReport('dashboard', 'PDF');
    } catch (err) {
      console.error('Error al exportar dashboard:', err);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Dashboard Financiero</Typography>
        
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
          
          <IconButton onClick={loadFinancialData} color="primary">
            <RefreshIcon />
          </IconButton>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportDashboard}
            size="small"
          >
            Exportar
          </Button>
        </Box>
      </Box>
      
      {/* Filtros adicionales (opcional) */}
      {filtersOpen && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Filtros adicionales
          </Typography>
          
          <Grid container spacing={2}>
            {/* Aquí irían los filtros adicionales */}
          </Grid>
        </Paper>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tarjetas de KPIs principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialKPICard
            title="Total Facturado"
            value={kpis.total_invoiced}
            loading={loading.kpis}
            format="currency"
            icon={<TrendingUpIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialKPICard
            title="Total Recaudado"
            value={kpis.total_collected}
            loading={loading.kpis}
            format="currency"
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialKPICard
            title="Índice de Recaudo"
            value={kpis.collection_ratio}
            loading={loading.kpis}
            format="percentage"
            icon={<ArrowUpwardIcon />}
            color="info"
            trend={kpis.collection_ratio_trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialKPICard
            title="Tasa de Glosas"
            value={kpis.invoice_glosa_rate}
            loading={loading.kpis}
            format="percentage"
            icon={<ArrowDownwardIcon />}
            color="error"
            trend={kpis.invoice_glosa_rate_trend}
            invertTrend={true} // Menor es mejor
          />
        </Grid>
      </Grid>
      
      {/* Pestañas para diferentes vistas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Facturación y Recaudo" />
          <Tab label="Proyecciones" />
          <Tab label="Cartera" />
          <Tab label="Rentabilidad" />
        </Tabs>
      </Paper>
      
      {/* Contenido según pestaña seleccionada */}
      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Card>
                <CardHeader 
                  title="Tendencia de Facturación" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent>
                  {loading.billingData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <RevenueChart data={billingData} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Card>
                <CardHeader 
                  title="Tendencia de Recaudo" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent>
                  {loading.collectionData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <CollectionChart data={collectionData} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && (
          <Card>
            <CardHeader 
              title="Proyecciones Financieras" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button
                  variant="text"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => loadProjections()}
                >
                  Actualizar
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {loading.projectionData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <FinancialProjection data={projectionData} />
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === 2 && (
          <Card>
            <CardHeader 
              title="Análisis de Cartera por Edades" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button
                  variant="text"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => loadAccountsReceivable()}
                >
                  Actualizar
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {loading.accountsReceivable ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <AccountsReceivableAging data={accountsReceivable} />
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === 3 && (
          <Card>
            <CardHeader 
              title="Análisis de Rentabilidad" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button
                  variant="text"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => loadProfitabilityData()}
                >
                  Actualizar
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {loading.profitabilityData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ProfitabilityAnalysis data={profitabilityData} />
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default FinancialDashboard;