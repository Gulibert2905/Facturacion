// src/components/financialAnalysis/FinancialProjection.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Slider,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { LoadingButton } from '@mui/lab';
import RefreshIcon from '@mui/icons-material/Refresh';

import projectionService from '../financialAnalysis/projectionService';
import { useFinancial } from '../../../contexts/FinancialContext';

/**
 * Componente para mostrar y gestionar proyecciones financieras
 */
const FinancialProjection = ({ data = [] }) => {
  const { loadProjections } = useFinancial();
  
  // Estado local
  const [projectionMethod, setProjectionMethod] = useState('linear_regression');
  const [dataType, setDataType] = useState('revenue');
  const [periods, setPeriods] = useState(12);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [loading, setLoading] = useState(false);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  
  // Determinar si hay datos históricos y proyectados
  const historicalData = data.filter(item => !item.projected);
  const projectedData = data.filter(item => item.projected);
  
  // Aplicar cambios y generar nueva proyección
  const handleApplyChanges = async () => {
    setLoading(true);
    
    try {
      await loadProjections({
        method: projectionMethod,
        dataType,
        periods,
        confidenceLevel
      });
    } catch (error) {
      console.error('Error al generar proyección:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Formatear porcentaje
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Verificar si hay datos suficientes
  const hasEnoughData = historicalData.length >= 6;
  
  // Colores para el gráfico
  const colors = {
    historical: '#1976d2',
    projected: '#9c27b0',
    upperBound: '#d32f2f',
    lowerBound: '#2e7d32'
  };
  
  // Calcular resumen de la proyección
  const getProjectionSummary = () => {
    if (!projectedData.length) return null;
    
    const lastHistorical = historicalData[historicalData.length - 1];
    const lastProjected = projectedData[projectedData.length - 1];
    
    const totalGrowth = ((lastProjected.value / lastHistorical.value) - 1) * 100;
    const avgMonthlyGrowth = totalGrowth / projectedData.length;
    
    return {
      totalGrowth,
      avgMonthlyGrowth,
      initialValue: lastHistorical.value,
      finalValue: lastProjected.value
    };
  };
  
  const projectionSummary = getProjectionSummary();
  
  // Contenido personalizado para tooltip del gráfico
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
                  entry.dataKey === 'growthRate' 
                    ? formatPercentage(entry.value) 
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
  
  // Si no hay datos, mostrar mensaje
  if (data.length === 0) {
    return (
      <Alert severity="info">
        No hay datos disponibles para realizar proyecciones.
      </Alert>
    );
  }
  
  // Si no hay suficientes datos históricos
  if (!hasEnoughData) {
    return (
      <Alert severity="warning">
        Se requieren al menos 6 períodos de datos históricos para generar proyecciones confiables.
      </Alert>
    );
  }
  
  // Método de proyección en texto legible
  const getMethodName = (method) => {
    const methodsMap = {
      linear_regression: 'Regresión Lineal',
      moving_average: 'Media Móvil',
      seasonal: 'Estacional',
      growth_rate: 'Tasa de Crecimiento'
    };
    
    return methodsMap[method] || method;
  };
  
  // Tipo de datos en texto legible
  const getDataTypeName = (type) => {
    const typesMap = {
      revenue: 'Facturación',
      collection: 'Recaudo',
      profit: 'Rentabilidad'
    };
    
    return typesMap[type] || type;
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Panel de configuración */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Typography variant="subtitle1" gutterBottom>
              Configuración de Proyección
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Método de proyección */}
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="projection-method-label">Método de Proyección</InputLabel>
              <Select
                labelId="projection-method-label"
                value={projectionMethod}
                label="Método de Proyección"
                onChange={(e) => setProjectionMethod(e.target.value)}
              >
                {projectionService.projectionMethods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Tipo de datos */}
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="data-type-label">Tipo de Datos</InputLabel>
              <Select
                labelId="data-type-label"
                value={dataType}
                label="Tipo de Datos"
                onChange={(e) => setDataType(e.target.value)}
              >
                <MenuItem value="revenue">Facturación</MenuItem>
                <MenuItem value="collection">Recaudo</MenuItem>
                <MenuItem value="profit">Rentabilidad</MenuItem>
              </Select>
            </FormControl>
            
            {/* Períodos a proyectar */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Períodos a proyectar: {periods}
              </Typography>
              <Slider
                value={periods}
                onChange={(e, newValue) => setPeriods(newValue)}
                min={3}
                max={24}
                step={1}
                valueLabelDisplay="auto"
                size="small"
              />
            </Box>
            
            {/* Nivel de confianza (solo para algunos métodos) */}
            {projectionMethod === 'linear_regression' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Nivel de confianza: {confidenceLevel}%
                </Typography>
                <Slider
                  value={confidenceLevel}
                  onChange={(e, newValue) => setConfidenceLevel(newValue)}
                  min={80}
                  max={99}
                  step={1}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
            )}
            
            {/* Mostrar intervalo de confianza */}
            {projectionMethod === 'linear_regression' && (
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <RadioGroup
                  row
                  value={showConfidenceInterval ? 'yes' : 'no'}
                  onChange={(e) => setShowConfidenceInterval(e.target.value === 'yes')}
                >
                  <FormControlLabel 
                    value="yes" 
                    control={<Radio />} 
                    label="Mostrar intervalo de confianza" 
                  />
                  <FormControlLabel 
                    value="no" 
                    control={<Radio />} 
                    label="Ocultar intervalo" 
                  />
                </RadioGroup>
              </FormControl>
            )}
            
            {/* Botón para aplicar cambios */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <LoadingButton
                variant="contained"
                startIcon={<RefreshIcon />}
                loading={loading}
                onClick={handleApplyChanges}
                fullWidth
              >
                Generar Proyección
              </LoadingButton>
            </Box>
          </Paper>
        </Grid>
        
        {/* Gráfico y resumen */}
        <Grid item xs={12} md={8}>
          {/* Tarjetas de resumen */}
          {projectionSummary && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Proyección a {periods} períodos
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(projectionSummary.finalValue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Crecimiento total estimado
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={projectionSummary.totalGrowth >= 0 ? 'success.main' : 'error.main'}
                    >
                      {projectionSummary.totalGrowth >= 0 ? '+' : ''}
                      {projectionSummary.totalGrowth.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          
          {/* Gráfico de proyección */}
          <Paper sx={{ p: 2, height: '100%' }} variant="outlined">
            <Typography variant="subtitle1" gutterBottom>
              Proyección: {getMethodName(projectionMethod)} - {getDataTypeName(dataType)}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatCurrency} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Línea de separación entre histórico y proyectado */}
                  {historicalData.length > 0 && projectedData.length > 0 && (
                    <ReferenceLine
                      x={historicalData[historicalData.length - 1].date}
                      stroke="#666"
                      strokeDasharray="3 3"
                    >
                      <Label
                        value="Proyección"
                        position="insideTopRight"
                        style={{ fill: '#666' }}
                      />
                    </ReferenceLine>
                  )}
                  
                  {/* Datos históricos */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    data={historicalData}
                    name="Histórico"
                    stroke={colors.historical}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Datos proyectados */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    data={projectedData}
                    name="Proyección"
                    stroke={colors.projected}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  
                  {/* Intervalos de confianza si están disponibles y habilitados */}
                  {showConfidenceInterval && projectionMethod === 'linear_regression' && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="upperBound"
                        data={projectedData}
                        name="Límite Superior"
                        stroke={colors.upperBound}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="lowerBound"
                        data={projectedData}
                        name="Límite Inferior"
                        stroke={colors.lowerBound}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Box>
            
            {/* Alertas y notas */}
            {projectionMethod === 'linear_regression' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  La proyección por regresión lineal muestra una tendencia basada en los datos históricos
                  con un nivel de confianza del {confidenceLevel}%. Los límites superior e inferior 
                  indican el rango dentro del cual se espera que estén los valores reales.
                </Typography>
              </Alert>
            )}
            
            {projectionMethod === 'seasonal' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  La proyección estacional tiene en cuenta patrones cíclicos en los datos históricos.
                  Para mejores resultados, se recomienda tener al menos 24 meses de datos históricos.
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialProjection;