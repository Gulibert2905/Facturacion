// src/components/financialAnalysis/AccountsReceivableAging.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as ChartTooltip
} from 'recharts';

/**
 * Componente que muestra el análisis de cartera por edades
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.data - Datos de cartera por edades
 */
const AccountsReceivableAging = ({ data = [] }) => {
  // Estado local
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
  
  // Calcular totales
  const calculateTotals = () => {
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    
    return { totalAmount, totalCount };
  };
  
  const { totalAmount, totalCount } = calculateTotals();
  
  // Colores para el gráfico según el rango de edades
  const getAgeRangeColor = (rangeName) => {
    if (rangeName.includes('0-30')) return '#4caf50';
    if (rangeName.includes('31-60')) return '#8bc34a';
    if (rangeName.includes('61-90')) return '#ffeb3b';
    if (rangeName.includes('91-180')) return '#ff9800';
    if (rangeName.includes('181-360')) return '#f44336';
    return '#b71c1c'; // > 360 días
  };
  
  // Determinar la severidad de un rango de cartera
  const getAgingSeverity = (rangeName) => {
    if (rangeName.includes('0-30')) return 'success';
    if (rangeName.includes('31-60')) return 'info';
    if (rangeName.includes('61-90')) return 'warning';
    return 'error'; // > 90 días
  };
  
  // Preparar datos para el gráfico de torta
  const pieChartData = data.map(item => ({
    name: item.rangeName,
    value: item.amount,
    percentage: (item.amount / totalAmount) * 100,
    color: getAgeRangeColor(item.rangeName)
  }));
  
  // Contenido personalizado para tooltip del gráfico
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card sx={{ boxShadow: 3, p: 1, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {data.name}
          </Typography>
          <Typography variant="body2">
            {formatCurrency(data.value)}
          </Typography>
          <Typography variant="body2">
            {data.percentage.toFixed(1)}% del total
          </Typography>
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
                Total Cartera
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Facturas
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Promedio por Factura
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Vista
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <Select
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="chart">Gráfico</MenuItem>
                  <MenuItem value="table">Tabla</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Vista de gráfico */}
      {viewType === 'chart' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Distribución de Cartera por Edades
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Resumen por Rango
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rango</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="right">Facturas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.rangeName}>
                        <TableCell>
                          <Chip 
                            label={row.rangeName} 
                            size="small"
                            color={getAgingSeverity(row.rangeName)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell align="right">
                          {((row.amount / totalAmount) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Vista de tabla */}
      {viewType === 'table' && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Detalle de Cartera por Edades
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rango de Edad</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell align="right">% del Total</TableCell>
                  <TableCell align="right">Facturas</TableCell>
                  <TableCell align="right">Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.rangeName}>
                    <TableCell>
                      <Chip 
                        label={row.rangeName} 
                        color={getAgingSeverity(row.rangeName)}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                    <TableCell align="right">
                      {((row.amount / totalAmount) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.count > 0 ? row.amount / row.count : 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    100%
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {totalCount}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AccountsReceivableAging;