// src/components/rips/RipsFileSelector.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  Button,
  Paper,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import ripsValidationService from '../../services/rips/ripsValidationService';

/**
 * Componente para selección de archivos y configuración de RIPS
 */
const RipsFileSelector = ({ resolution, onChange, data }) => {
  // Estado para opciones de configuración
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [entityCode, setEntityCode] = useState('');
  const [entities, setEntities] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  // Cargar información inicial
  useEffect(() => {
    // Cargar entidades (simulado)
    setEntities([
      { code: 'EPS001', name: 'EPS Sura' },
      { code: 'EPS002', name: 'Nueva EPS' },
      { code: 'EPS003', name: 'Salud Total' },
      { code: 'EPS004', name: 'Coomeva EPS' }
    ]);

    // Cargar tipos de archivos disponibles según resolución
    loadFileTypes();

    // Inicializar formulario con datos existentes si hay
    if (data) {
      setStartDate(data.startDate ? new Date(data.startDate) : null);
      setEndDate(data.endDate ? new Date(data.endDate) : null);
      setEntityCode(data.entityCode || '');
      setSelectedFiles(data.includeFiles || []);
    }
  }, [resolution, data]);

  // Cargar tipos de archivos según resolución
  const loadFileTypes = async () => {
    try {
      const structure = await ripsValidationService.getRipsStructure(resolution);
      setAvailableFiles(structure.fileTypes);
      
      // Si no hay archivos seleccionados previamente, seleccionar todos
      if (!data || !data.includeFiles) {
        const allFileCodes = structure.fileTypes.map(file => file.code);
        setSelectedFiles(allFileCodes);
      }
    } catch (error) {
      console.error('Error al cargar tipos de archivos:', error);
    }
  };

  // Actualizar data cuando cambian los campos
  useEffect(() => {
    if (onChange) {
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
      const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;
      
      const formData = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        entityCode,
        entityName: entities.find(e => e.code === entityCode)?.name || '',
        includeFiles: selectedFiles
      };
      
      onChange(formData);
    }
  }, [startDate, endDate, entityCode, selectedFiles, entities, onChange]);

  // Manejar cambio en selección de archivos
  const handleFileChange = (fileCode) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileCode)) {
        return prev.filter(code => code !== fileCode);
      } else {
        return [...prev, fileCode];
      }
    });
  };

  // Seleccionar todos los archivos
  const selectAllFiles = () => {
    const allFileCodes = availableFiles.map(file => file.code);
    setSelectedFiles(allFileCodes);
  };

  // Deseleccionar todos los archivos
  const deselectAllFiles = () => {
    // Mantener solo los obligatorios según resolución
    const mandatoryFiles = resolution === '3374' ? ['AF', 'US'] : ['AFCT', 'ATUS'];
    setSelectedFiles(mandatoryFiles);
  };

  // Información según resolución
  const getResolutionInfo = () => {
    if (resolution === '3374') {
      return {
        title: 'Resolución 3374 de 2000',
        description: 'Configure los parámetros para generar RIPS según la Resolución 3374 de 2000.'
      };
    }
    return {
      title: 'Resolución 2275 de 2023',
      description: 'Configure los parámetros para generar RIPS según la nueva Resolución 2275 de 2023.'
    };
  };

  const resolutionInfo = getResolutionInfo();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de RIPS - {resolutionInfo.title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        {resolutionInfo.description}
      </Typography>

      {/* Ayuda e información */}
      {showHelp && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Información sobre RIPS:
          </Typography>
          <Typography variant="body2">
            Los Registros Individuales de Prestación de Servicios de Salud (RIPS) son el conjunto de 
            datos que el Sistema General de Seguridad Social en Salud requiere para los procesos de 
            dirección, regulación y control.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            La {resolution === '3374' ? 'Resolución 3374 de 2000' : 'Resolución 2275 de 2023'} establece 
            los requisitos mínimos de información y la estructura de los archivos a presentar.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Configuración de períodos */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Período de facturación:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Fecha inicial"
                    value={startDate}
                    onChange={setStartDate}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Fecha final"
                    value={endDate}
                    onChange={setEndDate}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth margin="normal">
                <InputLabel id="entity-select-label">Entidad administradora</InputLabel>
                <Select
                  labelId="entity-select-label"
                  value={entityCode}
                  label="Entidad administradora"
                  onChange={(e) => setEntityCode(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Seleccione una entidad</em>
                  </MenuItem>
                  {entities.map((entity) => (
                    <MenuItem key={entity.code} value={entity.code}>
                      {entity.name} ({entity.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Selección de archivos */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Archivos a generar:
                </Typography>
                <Box>
                  <Button size="small" onClick={selectAllFiles}>Todos</Button>
                  <Button size="small" onClick={deselectAllFiles}>Mínimos</Button>
                  <Tooltip title="Mostrar/ocultar ayuda">
                    <Button 
                      size="small" 
                      onClick={() => setShowHelp(!showHelp)}
                      startIcon={<HelpOutlineIcon />}
                    >
                      Ayuda
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <FormGroup>
                <Grid container spacing={1}>
                  {availableFiles.map((file) => (
                    <Grid item xs={12} sm={6} key={file.code}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedFiles.includes(file.code)}
                            onChange={() => handleFileChange(file.code)}
                            // Deshabilitar archivos obligatorios
                            disabled={
                              (resolution === '3374' && ['AF', 'US'].includes(file.code)) ||
                              (resolution === '2275' && ['AFCT', 'ATUS'].includes(file.code))
                            }
                          />
                        }
                        label={`${file.code} - ${file.name}`}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Los archivos marcados como obligatorios no pueden ser deseleccionados.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Información adicional */}
      <Paper 
        variant="outlined" 
        sx={{ p: 2, mt: 3, backgroundColor: resolution === '3374' ? 'info.lighter' : 'warning.lighter' }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {resolution === '3374' 
            ? 'Información sobre Resolución 3374 de 2000:' 
            : 'Información sobre Resolución 2275 de 2023:'
          }
        </Typography>
        <Typography variant="body2">
          {resolution === '3374' 
            ? 'La Resolución 3374 de 2000 establece el formato estándar para el registro y envío de los datos de prestación de servicios de salud.' 
            : 'La Resolución 2275 de 2023 actualiza los requisitos y estructura de los RIPS para adecuarse a los cambios normativos del sector salud.'
          }
        </Typography>
      </Paper>
    </Box>
  );
};

export default RipsFileSelector;