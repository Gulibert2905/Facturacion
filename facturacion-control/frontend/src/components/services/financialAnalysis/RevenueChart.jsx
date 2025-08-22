// src/components/financialAnalysis/RevenueChart.jsx
import React, { useState } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as ChartTooltip,
  Bar,
  BarChart,
  ComposedChart
} from 'recharts';

/**
 * Componente que muestra las tendencias de facturación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.data - Datos para el gráfico
 * @param {Function} props.onPeriodChange - Función llamada al cambiar el período
 * @param {string} props.defaultPeriod - Período por defecto (monthly, quarterly, yearly)
 */
const RevenueChart = ({ 
  data = [], 
  onPeriodChange,
  defaultPeriod = 'monthly'
}) => {
  // Estado local
  const [period, setPeriod] = useState(defaultPeriod);
  const [chartType, setChartType] = useState('line');
  
  // Manejar cambio de período
  const handlePeriodChange = (event) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };
  
  // Manejar cambio de tipo de gráfico
  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };
  
  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography color="text.secondary">
          No hay datos disponibles para mostrar
        </Typography>
      </Box>
    );
  }
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Configurar colores
  const colors = {
    invoiced: '#1976d2',
    target: '#9c27b0',
    growth: '#2e7d32'
  };
  
  // Contenido personalizado para tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ boxShadow: 3, p: 1, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          
          {payload.map((entry, index) => (
            <Box key={`tooltip-item-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  mr: 1
                }}
              />
              <Typography variant="body2">
                {entry.name}: {entry.dataKey === 'growth' ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    
    return null;
  };
  
  // Renderizar gráfico según el tipo seleccionado
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={formatCurrency}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="invoiced" 
                name="Facturación" 
                fill={colors.invoiced} 
                yAxisId="left" 
              />
              <Bar 
                dataKey="target" 
                name="Meta" 
                fill={colors.target} 
                yAxisId="left" 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={formatCurrency}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="invoiced" 
                name="Facturación" 
                fill={colors.invoiced} 
                yAxisId="left" 
              />
              <Line 
                type="monotone" 
                dataKey="growth" 
                name="Crecimiento" 
                stroke={colors.growth} 
                yAxisId="right" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={formatCurrency}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="invoiced" 
                name="Facturación" 
                stroke={colors.invoiced} 
                yAxisId="left" 
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                name="Meta" 
                stroke={colors.target} 
                yAxisId="left" 
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };
  
  // Resumen de tendencia
  const calculateTrend = () => {
    if (data.length < 2) return null;
    
    const lastPeriod = data[data.length - 1];
    const prevPeriod = data[data.length - 2];
    
    const change = lastPeriod.invoiced - prevPeriod.invoiced;
    const percentChange = (change / prevPeriod.invoiced) * 100;
    
    return {
      change,
      percentChange,
      isPositive: change >= 0
    };
  };
  
  const trend = calculateTrend();
  
  return (
    <Box>
      {/* Controles para el gráfico */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="period-select-label">Período</InputLabel>
          <Select
            labelId="period-select-label"
            id="period-select"
            value={period}
            label="Período"
            onChange={handlePeriodChange}
          >
            <MenuItem value="monthly">Mensual</MenuItem>
            <MenuItem value="quarterly">Trimestral</MenuItem>
            <MenuItem value="yearly">Anual</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="chart-type-select-label">Tipo</InputLabel>
          <Select
            labelId="chart-type-select-label"
            id="chart-type-select"
            value={chartType}
            label="Tipo"
            onChange={handleChartTypeChange}
          >
            <MenuItem value="line">Líneas</MenuItem>
            <MenuItem value="bar">Barras</MenuItem>
            <MenuItem value="composed">Compuesto</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Resumen de tendencia */}
      {trend && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box 
              sx={{ 
                p: 1, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Último período
              </Typography>
              <Typography variant="h6">
                {formatCurrency(data[data.length - 1].invoiced)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box 
              sx={{ 
                p: 1, 
                bgcolor: trend.isPositive ? 'success.lighter' : 'error.lighter',
                border: '1px solid',
                borderColor: trend.isPositive ? 'success.light' : 'error.light',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Variación
              </Typography>
              <Typography 
                variant="h6" 
                color={trend.isPositive ? 'success.dark' : 'error.dark'}
              >
                {trend.isPositive ? '+' : ''}{trend.percentChange.toFixed(1)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
      
      {/* Gráfico */}
      {renderChart()}
    </Box>
  );
};

export default RevenueChart;