// Nuevo componente PreBillHistory.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

function PreBillHistory() {
  const [preBills, setPreBills] = useState([]);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    company: '',
    contract: '',
    status: ''
  });
  
  const loadPreBills = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      });

      const response = await fetch(`http://localhost:5000/api/prebills/history?${queryParams}`);
      const data = await response.json();
      setPreBills(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReprint = async (preBillId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/prebills/reprint/${preBillId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prefactura_reimpresion_${preBillId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Error al reimprimir prefactura');
      }
    } catch (error) {
      console.error('Error:', error);
     
    }
  };
  useEffect(() => {
    loadPreBills();
  }, [filters]);

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Fecha Inicio"
              value={filters.startDate}
              onChange={(date) => setFilters({...filters, startDate: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Fecha Fin"
              value={filters.endDate}
              onChange={(date) => setFilters({...filters, endDate: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="exported">Exportada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Contrato</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {preBills.map((bill) => (
              <TableRow key={bill._id}>
                <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{bill.companyId.name}</TableCell>
                <TableCell>{bill.contractId.name}</TableCell>
                <TableCell>{bill.patientId.fullName}</TableCell>
                <TableCell>{bill.totalValue}</TableCell>
                <TableCell>{bill.status}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleReprint(bill._id)}
                  >
                    Reimprimir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default PreBillHistory;