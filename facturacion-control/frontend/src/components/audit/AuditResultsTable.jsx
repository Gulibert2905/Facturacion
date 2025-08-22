// src/components/audit/AuditResultsTable.jsx
import React from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Chip
} from '@mui/material';

const AuditResultsTable = ({ results, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!results || results.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay resultados de auditoría disponibles
        </Typography>
      </Paper>
    );
  }
  
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Entidad</TableCell>
            <TableCell>Hallazgos</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{new Date(result.auditDate).toLocaleDateString()}</TableCell>
              <TableCell>{result.entityName}</TableCell>
              <TableCell>{result.findingsCount}</TableCell>
              <TableCell>
                <Chip 
                  label={result.status} 
                  color={result.status === 'completed' ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AuditResultsTable;