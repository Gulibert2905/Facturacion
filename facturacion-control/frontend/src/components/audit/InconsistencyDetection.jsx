// src/components/audit/InconsistencyDetection.jsx
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const InconsistencyDetection = () => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Detección de Inconsistencias
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Componente en desarrollo. Aquí se mostrará la detección de inconsistencias en datos de facturación.
        </Typography>
        <Box sx={{ mt: 2, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Funcionalidades planificadas:
          </Typography>
          <ul>
            <li>Verificación de coherencia entre totales y detalle</li>
            <li>Validación de información demográfica de pacientes</li>
            <li>Detección de duplicidad de servicios</li>
            <li>Validación de fechas y periodos</li>
          </ul>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InconsistencyDetection;