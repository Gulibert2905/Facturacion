// src/components/financialAnalysis/ProfitabilityAnalysis.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Componente que muestra el análisis de rentabilidad
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.data - Datos de rentabilidad
 */
const ProfitabilityAnalysis = ({ data = [] }) => {
  // Estado local
  const [groupBy, setGroupBy] = useState('service');
  const [orderBy, setOrderBy] = useState('margin');
  const [order, setOrder] = useState('desc');
  const [viewType, setViewType] = useState('chart');
  
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
  
  // Calcular resumen general
  const calculateSummary = () => {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      overallMargin
    };
  };
  
  const summary = calculateSummary();
  
  // Manejar cambio de ordenamiento
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Ordenar datos
  const sortedData = [...data].sort((a, b) => {
    const factor = order === 'asc' ? 1 : -1;
    
    if (orderBy === 'profit' || orderBy === 'revenue' || orderBy === 'cost') {
      return factor * (a[orderBy] - b[orderBy]);
    } else if (orderBy === 'margin') {
      return factor * (a.margin - b.margin);
    } else {
      // Ordenar por texto (nombre, tipo, etc.)
      return factor * a[orderBy].localeCompare(b[orderBy]);
    }
  });
  
  // Determinar color según el margen de rentabilidad
  const getMarginColor = (margin) => {
    if (margin >= 30) return 'success';
    if (margin >= 15) return 'info';
    if (margin >= 0) return 'warning';
    return 'error';
  };
  
  // Preparar datos para gráfico
  const chartData = sortedData.slice(0, 10); // Mostrar solo los 10 primeros para claridad
  
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
                  entry.dataKey === 'margin' 
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
  
  return (
    <Box>
      {/* Controles y resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Ingresos Totales
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {formatCurrency(summary.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Costos Totales
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {formatCurrency(summary.totalCost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Utilidad
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: summary.totalProfit >= 0 ? 'success.main' : 'error.main' 
                }}
              >
                {formatCurrency(summary.totalProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Margen General
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: summary.overallMargin >= 0 ? 'success.main' : 'error.main' 
                }}
              >
                {summary.overallMargin.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Controles de visualización */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="group-by-label">Agrupar por</InputLabel>
            <Select
              labelId="group-by-label"
              value={groupBy}
              label="Agrupar por"
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <MenuItem value="service">Tipo de Servicio</MenuItem>
              <MenuItem value="contract">Contrato</MenuItem>
              <MenuItem value="entity">Entidad</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="order-by-label">Ordenar por</InputLabel>
            <Select
              labelId="order-by-label"
              value={orderBy}
              label="Ordenar por"
              onChange={(e) => setOrderBy(e.target.value)}
            >
              <MenuItem value="margin">Margen</MenuItem>
              <MenuItem value="profit">Utilidad</MenuItem>
              <MenuItem value="revenue">Ingresos</MenuItem>
              <MenuItem value="cost">Costos</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="view-type-label">Vista</InputLabel>
            <Select
              labelId="view-type-label"
              value={viewType}
              label="Vista"
              onChange={(e) => setViewType(e.target.value)}
            >
              <MenuItem value="chart">Gráfico</MenuItem>
              <MenuItem value="table">Tabla</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Vista de gráfico */}
      {viewType === 'chart' && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Análisis de Rentabilidad por {
              groupBy === 'service' ? 'Tipo de Servicio' :
              groupBy === 'contract' ? 'Contrato' : 'Entidad'
            }
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={
                    groupBy === 'service' ? 'serviceType' :
                    groupBy === 'contract' ? 'contractName' : 'entityName'
                  } 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis yAxisId="left" orientation="left" tickFormatter={formatCurrency} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                <ChartTooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="revenue" 
                  name="Ingresos" 
                  fill="#1976d2" 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="cost" 
                  name="Costos" 
                  fill="#d32f2f" 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="profit" 
                  name="Utilidad" 
                  fill="#2e7d32" 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="margin" 
                  name="Margen %" 
                  fill="#9c27b0" 
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
      
      {/* Vista de tabla */}
      {viewType === 'table' && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Tabla de Rentabilidad por {
              groupBy === 'service' ? 'Tipo de Servicio' :
              groupBy === 'contract' ? 'Contrato' : 'Entidad'
            }
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {
                      groupBy === 'service' ? 'Tipo de Servicio' :
                      groupBy === 'contract' ? 'Contrato' : 'Entidad'
                    }
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'revenue'}
                      direction={orderBy === 'revenue' ? order : 'asc'}
                      onClick={() => handleRequestSort('revenue')}
                    >
                      Ingresos
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'cost'}
                      direction={orderBy === 'cost' ? order : 'asc'}
                      onClick={() => handleRequestSort('cost')}
                    >
                      Costos
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'profit'}
                      direction={orderBy === 'profit' ? order : 'asc'}
                      onClick={() => handleRequestSort('profit')}
                    >
                      Utilidad
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'margin'}
                      direction={orderBy === 'margin' ? order : 'asc'}
                      onClick={() => handleRequestSort('margin')}
                    >
                      Margen
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {
                        groupBy === 'service' ? row.serviceType :
                        groupBy === 'contract' ? row.contractName : row.entityName
                      }
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.cost)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{ color: row.profit >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatCurrency(row.profit)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${row.margin.toFixed(1)}%`}
                        color={getMarginColor(row.margin)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default ProfitabilityAnalysis;