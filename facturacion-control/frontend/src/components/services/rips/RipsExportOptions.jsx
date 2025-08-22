// src/components/rips/RipsExportOptions.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  FileCopy as FileCopyIcon,
  Assessment as AssessmentIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import ripsExportService from '../../services/rips/ripsExportService';

/**
 * Componente para opciones de exportación de RIPS
 */
const RipsExportOptions = ({ resolution, ripsId, onGenerate }) => {
  const [selectedFormat, setSelectedFormat] = useState('TXT');
  const [availableFormats, setAvailableFormats] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [error, setError] = useState(null);

  // Cargar formatos disponibles según resolución
  useEffect(() => {
    const formats = ripsExportService.getAvailableFormats(resolution);
    setAvailableFormats(formats);
    // Formato predeterminado TXT
    setSelectedFormat('TXT');
  }, [resolution]);

  // Verificar estado de exportación si hay un ID de RIPS
  useEffect(() => {
    if (ripsId) {
      checkStatus();
    }
  }, [ripsId]);

  // Verificar estado de exportación
  const checkStatus = async () => {
    try {
      if (!ripsId) return;
      
      const status = await ripsExportService.checkExportStatus(ripsId);
      setExportStatus(status);
      
      // Si no está listo, verificar nuevamente en 3 segundos
      if (status && status.status === 'processing') {
        setTimeout(checkStatus, 3000);
      }
    } catch (err) {
      console.error('Error al verificar estado:', err);
      setError('Error al verificar estado de exportación');
    }
  };

  // Cambiar formato seleccionado
  const handleFormatChange = (event) => {
    setSelectedFormat(event.target.value);
  };

  // Generar y exportar RIPS
  const handleExport = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      if (ripsId) {
        // Si ya tenemos un ID, solo exportar
        await ripsExportService.exportRips(ripsId, selectedFormat, resolution);
      } else {
        // Si no tenemos ID, generar y exportar
        await onGenerate(selectedFormat);
      }
    } catch (err) {
      setError('Error en la exportación: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Si está generando, mostrar spinner
  if (generating && !ripsId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={50} sx={{ mb: 2 }} />
        <Typography variant="body1">
          Generando archivos RIPS, esto puede tomar unos minutos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Exportación de RIPS - {resolution === '3374' ? 'Resolución 3374/2000' : 'Resolución 2275/2023'}
      </Typography>
      
      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estado de generación */}
      {exportStatus && (
        <Alert 
          severity={
            exportStatus.status === 'completed' ? 'success' : 
            exportStatus.status === 'processing' ? 'info' : 'warning'
          }
          sx={{ mb: 3 }}
        >
          {exportStatus.status === 'completed' 
            ? 'Los archivos RIPS han sido generados correctamente' 
            : exportStatus.status === 'processing'
            ? 'Los archivos RIPS están siendo procesados...'
            : 'Los archivos RIPS están en cola para ser procesados'
          }
        </Alert>
      )}

      {/* Opciones de formato */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Seleccione el formato de exportación:
          </Typography>
          
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              aria-label="formato-rips"
              name="formato-rips"
              value={selectedFormat}
              onChange={handleFormatChange}
            >
              {availableFormats.map((format) => (
                <FormControlLabel 
                  key={format.value}
                  value={format.value} 
                  control={<Radio />} 
                  label={format.label} 
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedFormat === 'TXT' 
              ? 'El formato TXT es el estándar oficial requerido por las EPS y el Ministerio de Salud.'
              : selectedFormat === 'XML' 
              ? 'El formato XML proporciona una estructura de datos más organizada y fácil de validar.'
              : 'El formato CSV permite trabajar fácilmente con los datos en Excel u otras herramientas.'
            }
          </Typography>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: 'info.lighter' }}>
        <Typography variant="subtitle2" gutterBottom>
          Información importante:
        </Typography>
        <Typography variant="body2" paragraph>
          Los archivos RIPS generados cumplen con todos los requerimientos establecidos 
          en la {resolution === '3374' ? 'Resolución 3374 de 2000' : 'Resolución 2275 de 2023'} 
          del Ministerio de Salud.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip 
            size="small" 
            label={resolution === '3374' ? 'Resolución 3374/2000' : 'Resolución 2275/2023'} 
            color="primary" 
          />
          <Chip 
            size="small" 
            label={`Formato ${selectedFormat}`} 
            color="secondary" 
          />
        </Stack>
      </Paper>

      {/* Botones de acción */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={generating}
            >
              {ripsId ? 'Descargar archivos RIPS' : 'Generar y descargar RIPS'}
            </Button>
          </Grid>
          
          {ripsId && (
            <Grid item>
              <Tooltip title="Guardar para uso posterior">
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<SaveIcon />}
                >
                  Guardar en historial
                </Button>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default RipsExportOptions;