import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Tooltip
} from '@mui/material';

const HeatmapChart = ({
  title,
  data = [],
  width = 400,
  height = 200,
  colorScale = ['#e6f3ff', '#0066cc'],
  maxValue
}) => {
  // Calcular el valor máximo si no se proporciona
  const calculatedMaxValue = maxValue || Math.max(...data.map(d => d.value), 1);
  
  // Función para interpolar colores
  const interpolateColor = (value) => {
    const intensity = value / calculatedMaxValue;
    const r = Math.floor(230 + (0 - 230) * intensity);
    const g = Math.floor(243 + (102 - 243) * intensity);
    const b = Math.floor(255 + (204 - 255) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Organizar datos en matriz para el heatmap
  const generateHeatmapData = () => {
    // Asumir que los datos vienen con coordenadas x, y
    const matrix = [];
    const rows = Math.max(...data.map(d => d.row || 0), 0) + 1;
    const cols = Math.max(...data.map(d => d.col || 0), 0) + 1;
    
    // Inicializar matriz
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = { value: 0, label: '' };
      }
    }
    
    // Llenar matriz con datos
    data.forEach(item => {
      const row = item.row || 0;
      const col = item.col || 0;
      matrix[row][col] = {
        value: item.value,
        label: item.label || item.name || `${item.value}`,
        originalData: item
      };
    });
    
    return matrix;
  };

  const matrixData = generateHeatmapData();
  const cellSize = Math.min(width / (matrixData[0]?.length || 1), height / matrixData.length);

  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          {/* Heatmap grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateRows: `repeat(${matrixData.length}, ${cellSize}px)`,
            gridTemplateColumns: `repeat(${matrixData[0]?.length || 0}, ${cellSize}px)`,
            gap: '2px',
            padding: '8px'
          }}>
            {matrixData.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Tooltip
                  key={`${rowIndex}-${colIndex}`}
                  title={`${cell.label}: ${cell.value}`}
                  arrow
                >
                  <Box
                    sx={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: interpolateColor(cell.value),
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        zIndex: 10
                      }
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: cell.value > calculatedMaxValue * 0.5 ? 'white' : 'text.primary',
                        fontWeight: 600,
                        fontSize: cellSize > 40 ? '0.75rem' : '0.6rem'
                      }}
                    >
                      {cell.value > 0 && cellSize > 30 ? cell.value : ''}
                    </Typography>
                  </Box>
                </Tooltip>
              ))
            )}
          </Box>

          {/* Leyenda */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Bajo
            </Typography>
            <Box sx={{ display: 'flex', height: 20, borderRadius: 1, overflow: 'hidden' }}>
              {Array.from({ length: 10 }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 20,
                    height: '100%',
                    backgroundColor: interpolateColor((calculatedMaxValue * i) / 9)
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Alto
            </Typography>
          </Box>

          {/* Estadísticas */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={600}>
                  {calculatedMaxValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Máximo
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={600}>
                  {Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length) || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Promedio
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={600}>
                  {data.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Elementos
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

// Componente simplificado para datos por días de la semana
export const WeeklyHeatmap = ({ data, title = "Actividad Semanal" }) => {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const heatmapData = days.flatMap((day, dayIndex) =>
    hours.map((hour, hourIndex) => {
      const item = data.find(d => d.day === dayIndex && d.hour === hour) || { value: 0 };
      return {
        row: dayIndex,
        col: hourIndex,
        value: item.value,
        label: `${day} ${hour}:00`,
        name: `${day} ${hour}:00 - ${item.value} servicios`
      };
    })
  );

  return (
    <HeatmapChart
      title={title}
      data={heatmapData}
      width={600}
      height={200}
    />
  );
};

export default HeatmapChart;