// src/pages/ImportData.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert, 
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow 
} from '@mui/material';
import * as XLSX from 'xlsx';
import { CloudUpload } from '@mui/icons-material';
import {Download} from "@mui/icons-material";

function ImportData() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [importResults, setImportResults] = useState(null);
  
  const downloadTemplate = async (type) => {
    try {
      const response = await fetch(`http://localhost:5000/api/import/template/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error al descargar la plantilla');
    }
  };

  // Validación de pacientes
  const validatePatientData = (row) => {
    // Solo los campos realmente obligatorios
    const requiredFields = [
      'documentType',
      'documentNumber',
      'firstName',
      'firstLastName',
      'birthDate',
      'regimen',
      'municipality'
    ];

    const errors = [];
    
    // Validar campos obligatorios
    for (const field of requiredFields) {
      if (!row.hasOwnProperty(field) || row[field] === null || row[field] === '') {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }

    // Validaciones específicas solo si el campo existe y tiene valor
    if (row.documentType && !['CC', 'TI', 'CE','PT','RC','PE', 'PA'].includes(row.documentType)) {
      errors.push('Tipo de documento inválido (debe ser CC, TI, CE, RC, PT, PA)');
    }

    if (row.gender && !['M', 'F'].includes(row.gender)) {
      errors.push('Género inválido (debe ser M o F)');
    }

    if (row.regimen && !['Contributivo', 'Subsidiado'].includes(row.regimen)) {
      errors.push('Régimen inválido (debe ser Contributivo o Subsidiado)');
    }

    // Validar formato de fecha
    if (row.birthDate) {
      const date = new Date(row.birthDate);
      if (isNaN(date.getTime())) {
        errors.push('Fecha de nacimiento inválida (usar formato YYYY-MM-DD)');
      }
    }

    // Campos opcionales no necesitan validación a menos que tengan valor
    const optionalFields = ['secondName', 'secondLastName', 'gender'];
    console.log('Campos opcionales presentes:', optionalFields.filter(field => row[field]));

    if (errors.length > 0) {
      console.log('Errores de validación encontrados:', errors);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  };

  const validateServiceData = (row) => {
    const requiredFields = [
      'documentNumber',
      'cupsCode',
      'serviceDate',
      'value'
    ];
  
    const errors = [];
  
    // Validar campos requeridos
    for (const field of requiredFields) {
      if (!row.hasOwnProperty(field) || row[field] === null || row[field] === '') {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }
  
    // Validar formato de fecha
    if (row.serviceDate) {
      const date = new Date(row.serviceDate);
      if (isNaN(date.getTime())) {
        errors.push('Fecha de servicio inválida (usar formato YYYY-MM-DD)');
      }
    }
  
    // Validar valor 
    if (!row.value) {
      errors.push('El valor del servicio es obligatorio');
    }
  
    // Validar documentNumber no sea null o vacío
    if (!row.documentNumber || row.documentNumber.trim() === '') {
      errors.push('El número de documento es obligatorio');
    }
  
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
  
    return { 
      isValid: true, 
      data: {
        ...row,
        contractId: row.contractId || '',
        // No modificamos el valor aquí, dejaremos que el backend lo maneje
        description: row.description || '',
        authorization: row.authorization || '',
        diagnosis: row.diagnosis || ''
      }
    };
  };

  // Función de manejo de archivos 
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
  
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportResults(null); 
  
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { 
            type: 'array',
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
          });
          
          const sheetName = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
          if (rawData.length === 0) {
            throw new Error('El archivo está vacío');
          }
  
          console.log('Datos originales del Excel:', rawData[0]);
          
          // Procesar los datos para manejar formateos especiales
          const data = rawData.map(row => {
            const processed = {...row};
            
            // Asegurar que las fechas sean objetos Date
            if (processed.birthDate && !(processed.birthDate instanceof Date)) {
              processed.birthDate = new Date(processed.birthDate);
            }
            
            if (processed.serviceDate && !(processed.serviceDate instanceof Date)) {
              processed.serviceDate = new Date(processed.serviceDate);
            }
            
            // No convertir el valor a número aquí, dejarlo como viene
            // para que el backend lo procese adecuadamente
            
            return processed;
          });
  
          console.log('Datos procesados:', data[0]);
          
          // Mostrar vista previa
          setPreview(data.slice(0, 5));
  
          // Validar cada fila según el tipo
          const errors = [];
          data.forEach((row, index) => {
            const validationResult = type === 'patients' 
              ? validatePatientData(row)
              : validateServiceData(row);
  
            if (!validationResult.isValid) {
              errors.push(`Error en la fila ${index + 1}: ${validationResult.errors.join(', ')}`);
            }
          });
  
          if (errors.length > 0) {
            throw new Error(`Se encontraron errores en los datos:\n${errors.join('\n')}`);
          }
  
          // Enviar al servidor si no hay errores
          const response = await fetch(`http://localhost:5000/api/import/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
          });
      
          const result = await response.json();
          console.log('Respuesta del servidor:', result);
          
          if (!response.ok) {
            throw new Error(result.message);
          }
      
          setSuccess(result.message);
          if (result.details) {
            setImportResults(result.details);
          }
          setPreview([]);
      
        } catch (error) {
          console.error('Error procesando archivo:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
  
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Importación Masiva de Datos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Pacientes
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Cargar Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'patients')}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('patients')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Campos Obligatorios:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - documentType (CC, TI, CE o PA)<br />
              - documentNumber (número de identificación)<br />
              - firstName (primer nombre)<br />
              - firstLastName (primer apellido)<br />
              - birthDate (YYYY-MM-DD)<br />
              - regimen (Contributivo/Subsidiado)<br />
              - municipality (municipio)
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Campos Opcionales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - secondName (segundo nombre)<br />
              - secondLastName (segundo apellido)<br />
              - gender (M/F)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Servicios
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Cargar Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'services')}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('services')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Campos Obligatorios:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - documentNumber (número de identificación del paciente)<br />
              - cupsCode (código del servicio)<br />
              - serviceDate (YYYY-MM-DD)<br />
              - value (valor del servicio)
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Campos Opcionales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - description (descripción del servicio)
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
              Nota: Los campos de autorización y diagnóstico se manejarán directamente en el módulo de servicios.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {preview.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Vista Previa (primeros 5 registros)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(preview[0]).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
              {preview.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row).map(([key, value], i) => (
                    <TableCell key={i}>
                      {value instanceof Date 
                        ? value.toISOString().split('T')[0]  // Formato YYYY-MM-DD para fechas
                        : typeof value === 'object' && value !== null
                          ? JSON.stringify(value)  // Para otros objetos
                          : value  // Mantener el valor como está para mostrar en la UI
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
        {importResults && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resultados de la importación
          </Typography>
          
          {importResults.success.length > 0 && (
            <>
              <Typography variant="subtitle1" color="success.main">
                Pacientes importados exitosamente: {importResults.success.length}
              </Typography>
              <Box sx={{ mb: 2 }}>
                {importResults.success.slice(0, 5).map((patient, index) => (
                  <Typography key={index} variant="body2">
                    • {patient.name} (Doc: {patient.documentNumber})
                  </Typography>
                ))}
                {importResults.success.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    Y {importResults.success.length - 5} más...
                  </Typography>
                )}
              </Box>
            </>
          )}
          
          {importResults.duplicates.length > 0 && (
            <>
              <Typography variant="subtitle1" color="warning.main">
                Pacientes duplicados (no importados): {importResults.duplicates.length}
              </Typography>
              <Box sx={{ mb: 2 }}>
                {importResults.duplicates.slice(0, 5).map((patient, index) => (
                  <Typography key={index} variant="body2">
                    • {patient.name} (Doc: {patient.documentNumber})
                  </Typography>
                ))}
                {importResults.duplicates.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    Y {importResults.duplicates.length - 5} más...
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default ImportData;