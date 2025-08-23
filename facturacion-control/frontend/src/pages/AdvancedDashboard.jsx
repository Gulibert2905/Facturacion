// src/pages/AdvancedDashboard.jsx - Código completo y funcional
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Refresh,
  Warning,
  Error,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  LocalHospital,
  People,
  Assignment
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import useApi from '../hooks/useApi';
import { formatCurrency, formatNumber } from '../utils/formatters';

const COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#F44336', '#9C27B0', '#00BCD4'];

const AdvancedDashboard = () => {
  // Estados para filtros
  const [filters, setFilters] = useState({
    period: 'month',
    company: 'all',
    contract: 'all',
    regimen: 'all',
    municipality: 'all'
  });

  // Obtener datos básicos
  const { data: companies, loading: loadingCompanies } = useApi('/companies');
  const { 
    data: contracts, 
    loading: loadingContracts,
    fetchData: fetchContracts 
  } = useApi('/contracts', { fetchOnMount: false });
  
  // Obtener datos del dashboard con filtros
  const { 
    data: dashboardData, 
    loading: loadingStats, 
    error: statsError,
    fetchData: refreshStats 
  } = useApi('/dashboard/stats/advanced', {
    defaultParams: { query: filters },
    fetchOnMount: true
  });

  const { 
    data: projections, 
    loading: loadingProjections,
    fetchData: refreshProjections 
  } = useApi('/dashboard/projections', {
    defaultParams: { query: { company: filters.company, contract: filters.contract } },
    fetchOnMount: true
  });

  // Obtener municipios y regímenes
  const { data: municipalities } = useApi('/reports/municipalities');
  const regimens = ['Contributivo', 'Subsidiado'];

  // Cargar contratos cuando cambia la empresa
  useEffect(() => {
    if (filters.company !== 'all') {
      fetchContracts({ endpoint: `/companies/${filters.company}/contracts` });
    }
  }, [filters.company, fetchContracts]);

  // Manejar cambios de filtros
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    
    // Si cambia la empresa, resetear el contrato
    if (filterType === 'company' && value !== filters.company) {
      newFilters.contract = 'all';
    }
    
    setFilters(newFilters);
  };

  // Efecto para refrescar datos cuando cambian filtros
  useEffect(() => {
    refreshStats({ query: filters });
    refreshProjections({ 
      query: { 
        company: filters.company, 
        contract: filters.contract 
      } 
    });
  }, [filters, refreshStats, refreshProjections]);

  // Componente para las tarjetas de métricas
  const MetricCard = ({ title, value, icon, color, loading, subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={40} />
            ) : (
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              bgcolor: `${color}.light`, 
              p: 1, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Componente para progreso de contratos con techo
  const ContractProgressSection = () => {
    const contractsWithCeiling = dashboardData?.contractsProgress || [];
    
    if (loadingStats) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Contratos con Techo Presupuestal
          </Typography>
          <Skeleton height={200} />
        </Paper>
      );
    }
    
    if (contractsWithCeiling.length === 0) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Contratos con Techo Presupuestal
          </Typography>
          <Alert severity="info">
            No hay contratos con techo presupuestal configurado para los filtros seleccionados
          </Alert>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Contratos con Techo Presupuestal
        </Typography>
        
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {contractsWithCeiling.map((contract) => {
            const getStatusIcon = (estado) => {
              switch (estado) {
                case 'critico': return <Error color="error" />;
                case 'alerta': return <Warning color="warning" />;
                default: return <CheckCircle color="success" />;
              }
            };

            const getProgressColor = (estado) => {
              switch (estado) {
                case 'critico': return 'error';
                case 'alerta': return 'warning';
                default: return 'success';
              }
            };

            return (
              <Card key={contract._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {contract.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contract.company?.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(contract.estado)}
                      <Chip 
                        label={`${contract.porcentajeEjecutado}%`}
                        color={getProgressColor(contract.estado)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(contract.porcentajeEjecutado, 100)}
                    color={getProgressColor(contract.estado)}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Facturado
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(contract.valorFacturado)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Disponible
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {formatCurrency(contract.valorDisponible)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Techo Total
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(contract.valorTecho)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {contract.estado === 'critico' && (
                    <Alert severity="error" sx={{ mt: 2 }} size="small">
                      Contrato próximo a agotarse - Contactar responsable
                    </Alert>
                  )}
                  {contract.estado === 'alerta' && (
                    <Alert severity="warning" sx={{ mt: 2 }} size="small">
                      Contrato en zona de alerta - Revisar proyecciones
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Paper>
    );
  };

  // Formatear datos para gráficos
  const formatTrendData = (data) => {
    return data?.map(item => ({
      name: item.period,
      value: item.count || item.value,
      displayValue: item.value || item.count
    })) || [];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Analítico
      </Typography>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros de Análisis
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={filters.period}
                label="Período"
                onChange={(e) => handleFilterChange('period', e.target.value)}
              >
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="week">Esta semana</MenuItem>
                <MenuItem value="month">Este mes</MenuItem>
                <MenuItem value="quarter">Trimestre</MenuItem>
                <MenuItem value="semester">Semestre</MenuItem>
                <MenuItem value="year">Este año</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={filters.company}
                label="Empresa"
                onChange={(e) => handleFilterChange('company', e.target.value)}
                disabled={loadingCompanies}
              >
                <MenuItem value="all">Todas</MenuItem>
                {companies?.map(company => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Contrato</InputLabel>
              <Select
                value={filters.contract}
                label="Contrato"
                onChange={(e) => handleFilterChange('contract', e.target.value)}
                disabled={filters.company === 'all' || loadingContracts}
              >
                <MenuItem value="all">Todos</MenuItem>
                {contracts?.map(contract => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Régimen</InputLabel>
              <Select
                value={filters.regimen}
                label="Régimen"
                onChange={(e) => handleFilterChange('regimen', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                {regimens.map(regimen => (
                  <MenuItem key={regimen} value={regimen}>
                    {regimen}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Municipio</InputLabel>
              <Select
                value={filters.municipality}
                label="Municipio"
                onChange={(e) => handleFilterChange('municipality', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                {municipalities?.map(municipality => (
                  <MenuItem key={municipality} value={municipality}>
                    {municipality}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Actualizar datos">
              <IconButton 
                color="primary" 
                onClick={() => {
                  refreshStats({ query: filters });
                  refreshProjections({ query: { company: filters.company, contract: filters.contract } });
                }}
                disabled={loadingStats}
                size="large"
              >
                {loadingStats ? <CircularProgress size={24} /> : <Refresh />}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Servicios Totales"
            value={formatNumber(dashboardData?.metrics?.totalServices || 0)}
            icon={<LocalHospital />}
            color="primary"
            loading={loadingStats}
            subtitle="En el período seleccionado"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ingresos Totales"
            value={formatCurrency(dashboardData?.metrics?.totalRevenue || 0)}
            icon={<AttachMoney />}
            color="success"
            loading={loadingStats}
            subtitle="Valor facturado"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pacientes Únicos"
            value={formatNumber(dashboardData?.metrics?.totalPatients || 0)}
            icon={<People />}
            color="info"
            loading={loadingStats}
            subtitle="Pacientes atendidos"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Servicios Pendientes"
            value={formatNumber(dashboardData?.metrics?.pendingServices || 0)}
            icon={<Assignment />}
            color="warning"
            loading={loadingStats}
            subtitle="Por facturar"
          />
        </Grid>
      </Grid>

      {/* Proyecciones */}
      {projections && !loadingProjections && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Proyecciones y Tendencias
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Proyección Mensual
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatCurrency(projections.monthlyProjection)}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp fontSize="small" color="success" />
                  Basado en tendencia
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Consumo Diario
                </Typography>
                <Typography variant="h5" color="info.main">
                  {formatCurrency(projections.burnRate)}/día
                </Typography>
                <Typography variant="caption">
                  Promedio últimos 30 días
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Promedio por Servicio
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(dashboardData?.metrics?.averageServiceValue || 0)}
                </Typography>
                <Typography variant="caption">
                  Valor promedio
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Puntos de Datos
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {projections.dataPoints}
                </Typography>
                <Typography variant="caption">
                  Días con actividad
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Contratos con techo presupuestal */}
        <Grid item xs={12} lg={6}>
          <ContractProgressSection />
        </Grid>
        
        {/* Distribución por régimen */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Régimen
            </Typography>
            {loadingStats ? (
              <Skeleton height={300} />
            ) : (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData?.distributions?.byRegimen || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData?.distributions?.byRegimen?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatNumber(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Tendencia de servicios */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tendencia de Servicios
            </Typography>
            {loadingStats ? (
              <Skeleton height={300} />
            ) : (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatTrendData(dashboardData?.trends?.servicesOverTime)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      name="Servicios"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Top municipios */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Top Municipios
            </Typography>
            {loadingStats ? (
              <Skeleton height={200} />
            ) : (
              <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                {dashboardData?.distributions?.byMunicipality?.map((municipality, index) => (
                  <Box key={municipality.name} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {municipality.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {municipality.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(municipality.count / (dashboardData?.distributions?.byMunicipality?.[0]?.count || 1)) * 100}
                      sx={{ height: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Ingresos por período */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ingresos por Período
            </Typography>
            {loadingStats ? (
              <Skeleton height={300} />
            ) : (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatTrendData(dashboardData?.trends?.revenueOverTime)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#4CAF50" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Errores */}
      {statsError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error cargando datos: {statsError}
        </Alert>
      )}
    </Box>
  );
};

export default AdvancedDashboard;