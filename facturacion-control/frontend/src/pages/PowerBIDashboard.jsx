import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Fab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AttachMoney,
  LocalHospital,
  People,
  Assignment,
  TrendingUp,
  Refresh,
  DarkMode,
  LightMode,
  Fullscreen,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

import ModernKPICard from '../components/dashboard/ModernKPICard';
import PowerBIChart from '../components/dashboard/PowerBIChart';
import GaugeChart from '../components/dashboard/GaugeChart';
import HeatmapChart, { WeeklyHeatmap } from '../components/dashboard/HeatmapChart';
import ModernFilters from '../components/dashboard/ModernFilters';
import secureStorage from '../utils/secureStorage';

const PowerBIDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: null,
    endDate: null,
    companies: [],
    status: 'all'
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Cargar datos del dashboard
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = secureStorage.getItem('token');
      const queryParams = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters.companies.length > 0 && { companies: filters.companies.join(',') }),
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await fetch(`http://localhost:5000/api/dashboard/advanced?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Cargar empresas
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const kpiData = dashboardData?.metrics || {};
  const contractsProgress = dashboardData?.contractsProgress || [];
  const distributions = dashboardData?.distributions || {};

  // Calcular tendencias (simuladas por ahora)
  const calculateTrend = (current, previous = current * 0.9) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Generar datos simulados para el heatmap semanal
  const generateWeeklyData = () => {
    const data = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour < 18; hour++) {
        // Simular más actividad en horas laborales
        let value = Math.floor(Math.random() * 50);
        if (hour >= 9 && hour <= 17 && day < 5) {
          value = Math.floor(Math.random() * 100) + 20;
        }
        data.push({ day, hour, value });
      }
    }
    return data;
  };

  // Generar datos simulados para el heatmap de región
  const generateRegionData = () => {
    const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
    return regions.map((region, index) => ({
      row: Math.floor(index / 2),
      col: index % 2,
      value: Math.floor(Math.random() * 100) + 10,
      label: region,
      name: `${region}: ${Math.floor(Math.random() * 100) + 10} servicios`
    }));
  };

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: darkMode ? 'grey.900' : 'grey.50', 
      minHeight: '100vh',
      transition: 'all 0.3s ease-in-out'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h3" fontWeight={700} sx={{ 
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Dashboard Analítico
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            }
            label={darkMode ? <DarkMode /> : <LightMode />}
          />
          <Tooltip title="Actualizar datos">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtros */}
      <ModernFilters
        companies={companies}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* KPIs principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <ModernKPICard
                title="Ingresos Totales"
                value={kpiData.totalRevenue || 0}
                unit="COP"
                subtitle="Ingresos del período"
                icon={AttachMoney}
                trend={12.5}
                trendValue={calculateTrend(kpiData.totalRevenue)}
                color="success"
                gradient={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernKPICard
                title="Servicios Prestados"
                value={kpiData.totalServices || 0}
                subtitle="Total de servicios"
                icon={LocalHospital}
                trend={8.3}
                trendValue={calculateTrend(kpiData.totalServices)}
                color="primary"
                gradient={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernKPICard
                title="Pacientes Atendidos"
                value={kpiData.totalPatients || 0}
                subtitle="Pacientes únicos"
                icon={People}
                trend={15.2}
                trendValue={calculateTrend(kpiData.totalPatients)}
                color="info"
                gradient={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernKPICard
                title="Servicios Pendientes"
                value={kpiData.pendingServices || 0}
                subtitle="Por procesar"
                icon={Assignment}
                trend={-5.1}
                trendValue={calculateTrend(kpiData.pendingServices)}
                color="warning"
                gradient={true}
              />
            </Grid>
          </Grid>

          {/* Gráficos principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <PowerBIChart
                title="Tendencia de Ingresos"
                subtitle="Evolución mensual de facturación"
                data={dashboardData?.revenueOverTime || []}
                type="area"
                height={350}
                color="#4facfe"
                gradient={true}
                xAxisKey="name"
                yAxisKey="value"
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <GaugeChart
                title="Utilización de Contratos"
                value={85}
                maxValue={100}
                warningThreshold={70}
                criticalThreshold={90}
                color="#667eea"
                size={250}
              />
            </Grid>
          </Grid>

          {/* Gráficos de distribución */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <PowerBIChart
                title="Servicios por Tipo"
                subtitle="Distribución de servicios prestados"
                data={distributions.byServiceType || []}
                type="bar"
                height={300}
                color="#2ed573"
                xAxisKey="name"
                yAxisKey="count"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PowerBIChart
                title="Facturación por Empresa"
                subtitle="Top empresas por ingresos"
                data={distributions.byCompany || []}
                type="bar"
                height={300}
                color="#ffa502"
                xAxisKey="name"
                yAxisKey="value"
              />
            </Grid>
          </Grid>

          {/* Heatmaps y análisis temporal */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <WeeklyHeatmap
                data={generateWeeklyData()}
                title="Mapa de Calor - Actividad por Día y Hora"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <HeatmapChart
                title="Servicios por Región"
                data={generateRegionData()}
                width={300}
                height={250}
              />
            </Grid>
          </Grid>

          {/* Progreso de contratos con techo */}
          {contractsProgress.length > 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Contratos con Techo Presupuestal
                  </Typography>
                  <Grid container spacing={2}>
                    {contractsProgress.map((contract) => (
                      <Grid item xs={12} md={6} lg={4} key={contract._id}>
                        <Card sx={{ 
                          borderRadius: 2, 
                          boxShadow: 2,
                          border: contract.estado === 'critico' ? '2px solid #ff4757' : 
                                contract.estado === 'alerta' ? '2px solid #ffa502' : '1px solid #e0e0e0'
                        }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {contract.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {contract.company?.name}
                            </Typography>
                            <GaugeChart
                              title=""
                              value={contract.porcentajeEjecutado}
                              maxValue={100}
                              warningThreshold={contract.alertas?.porcentajeAlerta || 80}
                              criticalThreshold={contract.alertas?.porcentajeCritico || 90}
                              size={150}
                            />
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                Facturado: ${(contract.valorFacturado || 0).toLocaleString()}
                              </Typography>
                              <Typography variant="body2">
                                Disponible: ${(contract.valorDisponible || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* FAB para refresh */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
          }
        }}
        onClick={handleRefresh}
        disabled={loading}
      >
        <Refresh />
      </Fab>
    </Box>
  );
};

export default PowerBIDashboard;