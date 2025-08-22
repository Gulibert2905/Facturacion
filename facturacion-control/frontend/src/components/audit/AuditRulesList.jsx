// src/components/audit/AuditRulesList.jsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Switch,
  Chip,
  IconButton,
  Typography,
  Box,
  Button
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const AuditRulesList = ({ rules, selectedRules, onRuleSelect }) => {
  if (!rules || rules.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay reglas de auditoría disponibles
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }}>
          Crear Regla
        </Button>
      </Paper>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained">
          Nueva Regla
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Severidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>{rule.category}</TableCell>
                <TableCell>
                  <Chip 
                    label={rule.severity} 
                    color={
                      rule.severity === 'critical' ? 'error' :
                      rule.severity === 'high' ? 'warning' :
                      rule.severity === 'medium' ? 'info' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={rule.active} 
                    onChange={() => onRuleSelect(rule)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AuditRulesList;