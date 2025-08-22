// src/components/services/financialAnalysis/CollectionChart.jsx
import React, { useState } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Typography,
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
  BarChart
} from 'recharts';

/**
 * Componente que muestra las tendencias de recaudo
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.data - Datos para el gráfico
 * @param {Function} props.onPeriodChange - Función llamada al cambiar el período
 * @param {string} props.defaultPeriod - Período por defecto (monthly, quarterly, yearly)
 */
const CollectionChart = ({ 
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
    collected: '#2e7d32', // Verde para recaudo
    target: '#9c27b0',    // Morado para la meta
    efficiency: '#1976d2' // Azul para eficiencia
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
                {entry.name}: {
                  entry.dataKey === 'efficiency' 
                    ? `${entry.value.toFixed(1)}%` 
                    : formatCurrency(entry.value)
                }
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
                dataKey="collected" 
                name="Recaudo" 
                fill={colors.collected} 
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
                dataKey="collected" 
                name="Recaudado" 
                stroke={colors.collected} 
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
  
  // Calcular resumen de eficiencia de recaudo
  const calculateEfficiency = () => {
    if (data.length === 0) return null;
    
    const lastPeriod = data[data.length - 1];
    const totalCollected = lastPeriod.collected || 0;
    const totalTarget = lastPeriod.target || 0;
    
    const efficiency = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;
    
    return {
      efficiency,
      collected: totalCollected,
      target: totalTarget
    };
  };
  
  const efficiency = calculateEfficiency();
  
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
          </Select>
        </FormControl>
      </Box>
      
      {/* Resumen de eficiencia de recaudo */}
      {efficiency && (
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
                Recaudo total
              </Typography>
              <Typography variant="h6">
                {formatCurrency(efficiency.collected)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box 
              sx={{ 
                p: 1, 
                bgcolor: efficiency.efficiency >= 90 ? 'success.lighter' : 
                         efficiency.efficiency >= 70 ? 'warning.lighter' : 'error.lighter',
                border: '1px solid',
                borderColor: efficiency.efficiency >= 90 ? 'success.light' : 
                             efficiency.efficiency >= 70 ? 'warning.light' : 'error.light',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Eficiencia de recaudo
              </Typography>
              <Typography 
                variant="h6" 
                color={efficiency.efficiency >= 90 ? 'success.dark' : 
                       efficiency.efficiency >= 70 ? 'warning.dark' : 'error.dark'}
              >
                {efficiency.efficiency.toFixed(1)}%
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

export default CollectionChart;