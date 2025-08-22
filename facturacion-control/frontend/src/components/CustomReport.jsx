// components/CustomReport.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Button,
  Table,
  TableContainer
} from '@mui/material';

function CustomReport() {
  // Estados para los filtros
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState({
    contract: '',
    regimen: '',
    municipality: '',
    company: '',
    startDate: '',
    endDate: ''
  });
  
  // Estado para la previsualización
  const [setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Campos disponibles para seleccionar
  const availableFields = [
    { id: 'documentNumber', label: 'Número Documento' },
    { id: 'documentType', label: 'Tipo Documento' },
    { id: 'fullName', label: 'Nombre Completo' },
    { id: 'regimen', label: 'Régimen' },
    { id: 'municipality', label: 'Municipio' },
    { id: 'contract', label: 'Contrato' },
    { id: 'serviceDate', label: 'Fecha Servicio' },
    { id: 'cupsCode', label: 'Código CUPS' },
    { id: 'description', label: 'Descripción' },
    { id: 'value', label: 'Valor' },
    { id: 'authorization', label: 'Autorización' }
  ];

  // Manejar selección de campos
  const handleFieldSelect = (fieldId) => {
    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  // Generar previsualización
  const handlePreview = async () => {
    try {
      const response = await fetch('/api/reports/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: selectedFields,
          filters: filters
        })
      });

      const data = await response.json();
      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generando previsualización:', error);
    }
  };

  // Exportar informe
  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: selectedFields,
          filters: filters
        })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_personalizado.xlsx';
      a.click();
    } catch (error) {
      console.error('Error exportando informe:', error);
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          {/* Sección de Filtros */}
          <Grid item xs={12} md={6}>
            <h3>Filtros</h3>
            <FormGroup>
              <Select
                value={filters.contract}
                onChange={(e) => setFilters({...filters, contract: e.target.value})}
                fullWidth
                sx={{ mb: 2 }}
                label="Contrato"
              >
                {/* Opciones de contratos */}
              </Select>

              <Select
                value={filters.regimen}
                onChange={(e) => setFilters({...filters, regimen: e.target.value})}
                fullWidth
                sx={{ mb: 2 }}
                label="Régimen"
              >
                <MenuItem value="subsidiado">Subsidiado</MenuItem>
                <MenuItem value="contributivo">Contributivo</MenuItem>
              </Select>

              {/* Más filtros... */}
            </FormGroup>
          </Grid>

          {/* Sección de Campos */}
          <Grid item xs={12} md={6}>
            <h3>Campos a Incluir</h3>
            <FormGroup>
              {availableFields.map(field => (
                <FormControlLabel
                  key={field.id}
                  control={
                    <Checkbox
                      checked={selectedFields.includes(field.id)}
                      onChange={() => handleFieldSelect(field.id)}
                    />
                  }
                  label={field.label}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>

        {/* Botones de Acción */}
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={handlePreview}
            sx={{ mr: 2 }}
          >
            Previsualizar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleExport}
            disabled={!selectedFields.length}
          >
            Exportar
          </Button>
        </Box>
      </Paper>

      {/* Previsualización */}
      {showPreview && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <h3>Previsualización</h3>
          <TableContainer>
            <Table>
              {/* Renderizar tabla con previewData */}
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default CustomReport;