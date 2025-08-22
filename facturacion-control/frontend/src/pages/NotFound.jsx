// src/pages/NotFound.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '70vh'
      }}
    >
      <Typography variant="h4" gutterBottom>
        Página no encontrada
      </Typography>
      <Typography variant="body1" paragraph>
        La ruta <strong>{location.pathname}</strong> no existe o no está disponible.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/dashboard')}
        sx={{ mt: 2 }}
      >
        Ir al Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;