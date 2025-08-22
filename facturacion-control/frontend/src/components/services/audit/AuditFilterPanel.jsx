// src/components/audit/AuditFilterPanel.jsx
import React from 'react';
import { Box, Paper, Typography, Button, Grid, Chip } from '@mui/material';

const AuditFilterPanel = ({ rules, selectedRules, onRuleSelect, onClose }) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filtros de Auditoría</Typography>
        <Button variant="outlined" onClick={onClose}>
          Cerrar
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Seleccione las reglas de auditoría a aplicar:
      </Typography>
      
      <Grid container spacing={1}>
        {(rules || []).map(rule => (
          <Grid item key={rule.id}>
            <Chip 
              label={rule.name}
              color={selectedRules.some(r => r.id === rule.id) ? "primary" : "default"}
              onClick={() => onRuleSelect(rule)}
              clickable
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default AuditFilterPanel;