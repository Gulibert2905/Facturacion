// src/components/LoadingIndicator.jsx
import React from 'react';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';

/**
 * Componente reutilizable para mostrar indicadores de carga
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de indicador ('circular' o 'linear')
 * @param {number} props.progress - Valor del progreso (0-100) para tipo 'linear'
 * @param {string} props.message - Mensaje a mostrar durante la carga
 * @param {string} props.size - Tamaño del indicador ('small', 'medium', 'large')
 */
const LoadingIndicator = ({ 
  type = 'circular', 
  progress = 0, 
  message = 'Cargando...', 
  size = 'medium' 
}) => {
  // Mapear tamaños a valores numéricos
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };
  
  const circularSize = sizeMap[size] || sizeMap.medium;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 2,
        minHeight: size === 'large' ? 120 : 'auto'
      }}
    >
      {type === 'circular' ? (
        <CircularProgress 
          size={circularSize} 
          thickness={4} 
        />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: size === 'large' ? 10 : size === 'medium' ? 6 : 4, borderRadius: 5 }} 
          />
          {progress > 0 && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center"
              sx={{ mt: 1 }}
            >
              {progress}%
            </Typography>
          )}
        </Box>
      )}
      
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator;