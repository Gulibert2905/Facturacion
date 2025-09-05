import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GaugeChart = ({
  title,
  value,
  maxValue = 100,
  unit = '%',
  color = '#4facfe',
  warningThreshold = 70,
  criticalThreshold = 85,
  size = 200
}) => {
  const percentage = (value / maxValue) * 100;
  
  const getColor = () => {
    if (percentage >= criticalThreshold) return '#ff4757';
    if (percentage >= warningThreshold) return '#ffa502';
    return color;
  };

  const data = [
    { name: 'filled', value: percentage },
    { name: 'empty', value: 100 - percentage }
  ];

  const COLORS = [getColor(), '#f0f0f0'];

  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <ResponsiveContainer width={size} height={size * 0.6}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius={size * 0.2}
                outerRadius={size * 0.35}
                dataKey="value"
                cornerRadius={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Valor en el centro */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -20%)',
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: getColor(),
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                mt: -0.5
              }}
            >
              {unit}
            </Typography>
          </Box>
        </Box>

        {/* Indicadores de estado */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 2, 
          mt: 2,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary">
              Normal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffa502' }} />
            <Typography variant="caption" color="text.secondary">
              Alerta
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff4757' }} />
            <Typography variant="caption" color="text.secondary">
              Crítico
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GaugeChart;