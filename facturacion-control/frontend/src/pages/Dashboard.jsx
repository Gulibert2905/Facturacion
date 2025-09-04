// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  AttachMoney, 
  People, 
  LocalHospital,
  Assignment,
  Refresh,
  CalendarToday,
  Business
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import useApi from '../hooks/useApi';
import { formatCurrency, formatNumber } from '../utils/formatters';


// Colores para los gráficos
const COLORS = ['#204888ff', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

// Componente para mostrar métricas en tarjetas
const MetricCard = memo(({ title, value, icon, color, trend, trendValue, loading, subtitle }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
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
              bgcolor: `${color}.lighter`, 
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
        
        {trend && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {trendValue > 0 ? (
              <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 18 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: 18 }} />
            )}
            <Typography 
              variant="body2" 
              color={trendValue > 0 ? 'success.main' : 'error.main'}
            >
              {Math.abs(trendValue)}% respecto al periodo anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// Componente principal de Dashboard
const Dashboard = () => {
  // Estado para filtros
  const [dateRange, setDateRange] = useState('month');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const isFirstRender = useRef(true);
  const [filterChangeCount, setFilterChangeCount] = useState(0);
  const isInitialMount = useRef(true);

  // Obtener datos de API
  const { 
    data: dashboardData, 
    loading: loadingDashboard, 
    error: dashboardError,
    fetchData: refreshDashboard 
  } = useApi('/dashboard/stats/advanced', {
    fetchOnMount: false, // Importante: no cargar automáticamente
    defaultParams: {
      query: { period: dateRange, company: selectedCompany, city: selectedCity }
    },
    withLoading: true
  });

  const { data: companies } = useApi('/companies');
  const { data: cities } = useApi('/patients/cities');

  useEffect(() => {
    // Solo cargar datos una vez al inicio
    refreshDashboard({ 
      query: { 
        period: dateRange, 
        company: selectedCompany,
        city: selectedCity 
      } 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    // No ejecutar en el montaje inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Solo si hubo un cambio en el contador de cambios de filtro
    if (filterChangeCount > 0) {
      refreshDashboard({ 
        query: { 
          period: dateRange, 
          company: selectedCompany 
        } 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterChangeCount]);

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    // Incrementamos el contador para que el efecto se dispare
    setFilterChangeCount(prev => prev + 1);
  };
  
  const handleCompanyChange = (newCompany) => {
    setSelectedCompany(newCompany);
    // Incrementamos el contador para que el efecto se dispare
    setFilterChangeCount(prev => prev + 1);
  };
  
  const handleCityChange = (newCity) => {
    setSelectedCity(newCity);
    // Incrementamos el contador para que el efecto se dispare
    setFilterChangeCount(prev => prev + 1);
  };
  
  // El useEffect que muestra el error se mantiene igual
  useEffect(() => {
    if (dashboardError) {
      setAlertMessage(`Error al cargar datos del dashboard: ${dashboardError}`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  }, [dashboardError]);

  // Función para manejar refrescado manual
  const handleRefresh = () => {
    refreshDashboard({ 
      query: { 
        period: dateRange, 
        company: selectedCompany,
        city: selectedCity 
      } 
    });
    setAlertMessage('Datos actualizados correctamente');
    setAlertSeverity('success');
    setAlertOpen(true);
  };


  // Datos por defecto para gráficos si no hay datos de API
  const defaultChartData = [
    { name: 'Ene', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Abr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 }
  ];

  // Preparar datos para los gráficos
  const servicesChartData = dashboardData?.servicesOverTime || defaultChartData;
  const revenueChartData = dashboardData?.revenueOverTime || defaultChartData;
  const servicesByTypeData = dashboardData?.servicesByType || [];
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Título y filtros */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={dateRange}
              label="Período"
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              <MenuItem value="week">Esta semana</MenuItem>
              <MenuItem value="month">Este mes</MenuItem>
              <MenuItem value="quarter">Este trimestre</MenuItem>
              <MenuItem value="year">Este año</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedCompany}
              label="Empresa"
              onChange={(e) => handleCompanyChange(e.target.value)}
            >
              <MenuItem value="all">Todas las empresas</MenuItem>
              {companies?.map(company => (
                <MenuItem key={company._id} value={company._id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ciudad</InputLabel>
            <Select
              value={selectedCity}
              label="Ciudad"
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <MenuItem value="all">Todas las ciudades</MenuItem>
              {cities?.map(city => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <IconButton 
            color="primary" 
            onClick={handleRefresh}
            disabled={loadingDashboard}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Cards de métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Servicios Totales"
            value={formatNumber(dashboardData?.totalServices || 0)}
            icon={<LocalHospital />}
            color="primary"
            trend={true}
            trendValue={dashboardData?.servicesTrend || 0}
            loading={loadingDashboard}
            subtitle="Servicios facturados"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ingresos Totales"
            value={formatCurrency(dashboardData?.totalRevenue || 0)}
            icon={<AttachMoney />}
            color="success"
            trend={true}
            trendValue={dashboardData?.revenueTrend || 0}
            loading={loadingDashboard}
            subtitle="Valor facturado"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pacientes Atendidos"
            value={formatNumber(dashboardData?.totalPatients || 0)}
            icon={<People />}
            color="info"
            loading={loadingDashboard}
            subtitle="Pacientes únicos"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Prefacturas Pendientes"
            value={formatNumber(dashboardData?.pendingPreBills || 0)}
            icon={<Assignment />}
            color="warning"
            loading={loadingDashboard}
            subtitle="Por validar"
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Gráfico de servicios en el tiempo */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Servicios Realizados</Typography>
              <Chip 
                icon={<CalendarToday fontSize="small" />} 
                label={dateRange === 'month' ? 'Mensual' : dateRange === 'week' ? 'Semanal' : dateRange === 'quarter' ? 'Trimestral' : 'Anual'} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </Box>
            
            <Box sx={{ height: 300 }}>
              {loadingDashboard ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={servicesChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Servicios" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Gráfico de tipo de servicios */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Distribución por Tipo</Typography>
            
            <Box sx={{ height: 300 }}>
              {loadingDashboard ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicesByTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {servicesByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Gráfico de ingresos */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Ingresos</Typography>
              <Chip 
                icon={<Business fontSize="small" />} 
                label={selectedCompany === 'all' ? 'Todas las empresas' : 'Empresa específica'} 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            </Box>
            
            <Box sx={{ height: 300 }}>
              {loadingDashboard ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="value" name="Ingresos" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Alertas */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default memo(Dashboard);