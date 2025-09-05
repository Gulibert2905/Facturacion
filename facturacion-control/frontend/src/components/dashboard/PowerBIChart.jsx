import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  MoreVert,
  Fullscreen,
  GetApp
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ComposedChart,
  Line,
  LineChart,
  Area,
  AreaChart
} from 'recharts';

const PowerBIChart = ({
  title,
  subtitle,
  data,
  type = 'bar', // bar, line, area, composed
  height = 300,
  xAxisKey = 'name',
  yAxisKey = 'value',
  color = '#4facfe',
  gradient = false,
  showGrid = true,
  showLegend = true,
  className,
  onExport,
  onFullscreen
}) => {
  const chartColors = {
    primary: '#4facfe',
    secondary: '#667eea',
    success: '#2ed573',
    warning: '#ffa502',
    error: '#ff4757',
    info: '#70a1ff'
  };

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    switch (type) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={yAxisKey} 
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: color }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={color}
              strokeWidth={2}
              fill={gradient ? `url(#${gradientId})` : color}
              fillOpacity={gradient ? 1 : 0.6}
            />
          </AreaChart>
        );

      case 'composed':
        return (
          <ComposedChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            {showLegend && <Legend />}
            <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
            <Line 
              type="monotone" 
              dataKey="trend" 
              stroke={chartColors.secondary}
              strokeWidth={3}
              dot={false}
            />
          </ComposedChart>
        );

      default: // bar
        return (
          <BarChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8884d8', fontSize: 12 }}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            {showLegend && <Legend />}
            <Bar 
              dataKey={yAxisKey} 
              fill={color} 
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        );
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: 3, 
        boxShadow: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: 6,
        }
      }}
      className={className}
    >
      <CardContent sx={{ p: 3, pb: 1 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2
        }}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onFullscreen && (
              <Tooltip title="Pantalla completa">
                <IconButton size="small" onClick={onFullscreen}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            )}
            {onExport && (
              <Tooltip title="Exportar">
                <IconButton size="small" onClick={onExport}>
                  <GetApp />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Más opciones">
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PowerBIChart;