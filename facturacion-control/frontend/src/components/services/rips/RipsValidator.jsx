// src/components/rips/RipsValidator.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import ripsService from '../../services/rips/ripsValidationService';

/**
 * Componente para validación de datos RIPS
 */
const RipsValidator = ({ resolution, data, validationResults, onValidate }) => {
  const [validating, setValidating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [structureInfo, setStructureInfo] = useState(null);

  // Cargar información de estructura según resolución
  useEffect(() => {
    const loadStructureInfo = async () => {
      try {
        const structure = await ripsService.getRipsStructure(resolution);
        setStructureInfo(structure);
      } catch (error) {
        console.error('Error al cargar estructura RIPS:', error);
      }
    };

    loadStructureInfo();
  }, [resolution]);

  // Iniciar validación manual
  const handleValidateClick = async () => {
    setValidating(true);
    try {
      await onValidate();
    } finally {
      setValidating(false);
    }
  };

  // Mostrar spinner durante validación
  if (validating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Validando datos RIPS...
        </Typography>
      </Box>
    );
  }

  // Si no hay datos para validar
  if (!data) {
    return (
      <Alert severity="info">
        Configure los datos en el paso anterior para continuar con la validación.
      </Alert>
    );
  }

  // Información de estructura según resolución
  const getResolutionInfo = () => {
    if (resolution === '3374') {
      return {
        title: 'Resolución 3374 de 2000',
        description: 'Validación según estándares de la Resolución 3374 de 2000 del Ministerio de Salud.'
      };
    }
    return {
      title: 'Resolución 2275 de 2023',
      description: 'Validación según estándares de la nueva Resolución 2275 de 2023.'
    };
  };

  const resolutionInfo = getResolutionInfo();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Validación previa de RIPS - {resolutionInfo.title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        {resolutionInfo.description}
      </Typography>

      {/* Resumen de datos a validar */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Resumen de datos a validar:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Período" 
                secondary={`${data.startDate || 'No definido'} - ${data.endDate || 'No definido'}`} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Entidad" 
                secondary={data.entityName || 'No definida'} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Tipo de archivo" 
                secondary={resolution === '3374' ? 'Estándar 3374' : 'Nuevo formato 2275'} 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Resultados de validación si existen */}
      {validationResults && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Resultados de la validación:
          </Typography>
          
          <Alert 
            severity={validationResults.isValid ? "success" : "error"}
            sx={{ mb: 2 }}
          >
            {validationResults.isValid 
              ? "Los datos han pasado todas las validaciones" 
              : `Se encontraron ${validationResults.errors.length} errores que deben corregirse`
            }
          </Alert>

          {/* Listado de errores si existen */}
          {validationResults.errors && validationResults.errors.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography color="error">
                  Errores encontrados ({validationResults.errors.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {validationResults.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={error.message} 
                        secondary={`Archivo: ${error.file}, Campo: ${error.field}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Listado de advertencias si existen */}
          {validationResults.warnings && validationResults.warnings.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography color="warning.main">
                  Advertencias ({validationResults.warnings.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {validationResults.warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={warning.message} 
                        secondary={`Archivo: ${warning.file}, Campo: ${warning.field}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* Información estructural de RIPS según resolución */}
      {structureInfo && (
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              Estructura de archivos RIPS {resolution === '3374' ? '3374/2000' : '2275/2023'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" gutterBottom>
              Archivos requeridos según la resolución {resolution}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {structureInfo.fileTypes.map((file) => (
                <Chip 
                  key={file.code}
                  label={`${file.code} - ${file.name}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">
              Para más detalles sobre los campos requeridos en cada archivo, consulte la documentación.
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Botón de validación */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={handleValidateClick}
          disabled={validating}
        >
          {validationResults ? "Volver a validar" : "Validar datos"}
        </Button>
      </Box>
    </Box>
  );
};

export default RipsValidator;