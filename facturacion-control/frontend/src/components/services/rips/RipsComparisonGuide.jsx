// src/components/rips/RipsComparisonGuide.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Compare as CompareIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

import rips3374Service from '../../services/rips/resolutions/rips3374Service';
import rips2275Service from '../../services/rips/resolutions/rips2275Service';

/**
 * Componente para mostrar guía de comparación entre resoluciones
 */
const RipsComparisonGuide = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [structure3374, setStructure3374] = useState(null);
  const [structure2275, setStructure2275] = useState(null);
  const [comparison, setComparison] = useState([]);
  
  // Cargar estructuras al montar el componente
  useEffect(() => {
    // Obtener estructuras
    const str3374 = rips3374Service.getStructure();
    const str2275 = rips2275Service.getStructure();
    
    setStructure3374(str3374);
    setStructure2275(str2275);
    
    // Generar comparación
    generateComparison(str3374, str2275);
  }, []);
  
  // Generar datos de comparación
  const generateComparison = (str3374, str2275) => {
    if (!str3374 || !str2275) return;
    
    const fileComparisons = [];
    
    // Mapeo entre archivos viejos y nuevos
    const fileMapping = {
      'AF': 'AFCT',
      'US': 'ATUS',
      'AC': 'ACCT',
      'AP': 'APCT',
      'AM': 'AMCT',
      'AT': 'AUCT',
      'AH': 'AHCT',
      'AN': 'ANCT',
      'AD': 'ADCT'
    };
    
    // Comparar cada tipo de archivo
    str3374.fileTypes.forEach(oldFile => {
      const newFileCode = fileMapping[oldFile.code];
      const newFile = str2275.fileTypes.find(f => f.code === newFileCode);
      
      if (newFile) {
        // Campos que están en ambos formatos (posiblemente con cambios)
        const commonFields = [];
        // Campos solo en formato viejo
        const removedFields = [];
        // Campos solo en formato nuevo
        const newFields = [];
        
        // Comparar campos
        oldFile.fields.forEach(oldField => {
          const newField = newFile.fields.find(f => f.name === oldField.name);
          
          if (newField) {
            // Campo existe en ambos formatos
            commonFields.push({
              name: oldField.name,
              oldLength: oldField.length,
              newLength: newField.length,
              oldRequired: oldField.required,
              newRequired: newField.required,
              changed: oldField.length !== newField.length || oldField.required !== newField.required
            });
          } else {
            // Campo solo existe en formato viejo
            removedFields.push(oldField);
          }
        });
        
        // Identificar campos nuevos
        newFile.fields.forEach(newField => {
          if (!oldFile.fields.find(f => f.name === newField.name)) {
            newFields.push(newField);
          }
        });
        
        fileComparisons.push({
          oldFile,
          newFile,
          commonFields,
          removedFields,
          newFields
        });
      }
    });
    
    setComparison(fileComparisons);
  };
  
  // Cambiar de pestaña
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guía de comparación entre resoluciones RIPS
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2">
          Información sobre la migración entre resoluciones:
        </Typography>
        <Typography variant="body2">
          Este componente muestra las diferencias entre la Resolución 3374 de 2000 y la 
          Resolución 2275 de 2023 para ayudar en el proceso de migración entre ambos formatos.
        </Typography>
      </Alert>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Resumen general" />
          <Tab label="Comparación de archivos" />
          <Tab label="Guía de migración" />
        </Tabs>
      </Paper>
      
      {/* Contenido según pestaña seleccionada */}
      <Box>
        {activeTab === 0 && (
          <GeneralSummary
            structure3374={structure3374}
            structure2275={structure2275}
          />
        )}
        
        {activeTab === 1 && (
          <FileComparison
            comparison={comparison}
          />
        )}
        
        {activeTab === 2 && (
          <MigrationGuide />
        )}
      </Box>
    </Box>
  );
};

/**
 * Componente de resumen general
 */
const GeneralSummary = ({ structure3374, structure2275 }) => {
  if (!structure3374 || !structure2275) {
    return <Typography>Cargando información...</Typography>;
  }
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Principales diferencias entre resoluciones
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Resolución 3374 de 2000
              </Typography>
              <Typography variant="body2" paragraph>
                La Resolución 3374 de 2000 del Ministerio de Salud es la norma que ha establecido 
                durante más de 20 años el formato estándar para los Registros Individuales de 
                Prestación de Servicios de Salud (RIPS).
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Características principales:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Archivos planos de texto (formato TXT)</li>
                <li>{structure3374.fileTypes.length} tipos de archivos</li>
                <li>Códigos de archivo de 2 caracteres (AF, US, AC, etc.)</li>
                <li>Diagnósticos en formato CIE-10 de 4 caracteres</li>
                <li>Información básica del paciente</li>
                <li>Estructura simple y ampliamente implementada</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="secondary" gutterBottom>
                Resolución 2275 de 2023
              </Typography>
              <Typography variant="body2" paragraph>
                La Resolución 2275 de 2023 actualiza el estándar de los RIPS para adecuarse a los 
                cambios normativos del sector salud y mejorar la calidad de la información 
                reportada.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Novedades principales:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Soporte para múltiples formatos (TXT, XML, CSV)</li>
                <li>{structure2275.fileTypes.length} tipos de archivos</li>
                <li>Códigos de archivo de 4 caracteres (AFCT, ATUS, ACCT, etc.)</li>
                <li>Diagnósticos en formato CIE-10 de 6 caracteres (mayor detalle)</li>
                <li>Campos adicionales (prefijo factura, correo electrónico, etc.)</li>
                <li>Mayor longitud en campos de texto (nombres, diagnósticos)</li>
                <li>Nuevos campos para interoperabilidad y trazabilidad</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning">
          <Typography variant="subtitle2">
            Importante:
          </Typography>
          <Typography variant="body2">
            La implementación de la Resolución 2275 de 2023 es obligatoria a partir de su 
            entrada en vigencia. Es necesario adaptar los sistemas para generar los nuevos 
            formatos requeridos.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

/**
 * Componente de comparación de archivos
 */
const FileComparison = ({ comparison }) => {
  const [expandedFile, setExpandedFile] = useState(null);
  
  // Manejar expansión de acordeón
  const handleExpand = (fileCode) => {
    setExpandedFile(expandedFile === fileCode ? null : fileCode);
  };
  
  if (!comparison || comparison.length === 0) {
    return <Typography>Cargando comparación de archivos...</Typography>;
  }
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Comparación detallada por tipo de archivo
      </Typography>
      
      {comparison.map((item) => (
        <Accordion 
          key={item.oldFile.code}
          expanded={expandedFile === item.oldFile.code}
          onChange={() => handleExpand(item.oldFile.code)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CompareIcon sx={{ mr: 1 }} color="primary" />
                <Typography>
                  <strong>{item.oldFile.code}</strong> ({item.oldFile.name}) → <strong>{item.newFile.code}</strong> ({item.newFile.name})
                </Typography>
              </Box>
              <Box>
                <Chip 
                  size="small" 
                  label={`${item.newFields.length} campos nuevos`} 
                  color="success" 
                  sx={{ mr: 1 }} 
                />
                {item.removedFields.length > 0 && (
                  <Chip 
                    size="small" 
                    label={`${item.removedFields.length} campos eliminados`} 
                    color="error" 
                  />
                )}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Tabla de campos comunes con cambios */}
              <Typography variant="subtitle2" gutterBottom>
                Campos comunes (con posibles cambios):
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Campo</TableCell>
                      <TableCell align="center">Longitud 3374</TableCell>
                      <TableCell align="center">Longitud 2275</TableCell>
                      <TableCell align="center">Obligatorio 3374</TableCell>
                      <TableCell align="center">Obligatorio 2275</TableCell>
                      <TableCell align="center">Cambios</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.commonFields.map((field) => (
                      <TableRow key={field.name} sx={{ bgcolor: field.changed ? 'warning.lighter' : 'inherit' }}>
                        <TableCell><strong>{field.name}</strong></TableCell>
                        <TableCell align="center">{field.oldLength}</TableCell>
                        <TableCell align="center">{field.newLength}</TableCell>
                        <TableCell align="center">
                          {field.oldRequired ? 
                            <CheckCircleIcon fontSize="small" color="success" /> : 
                            <CancelIcon fontSize="small" color="disabled" />
                          }
                        </TableCell>
                        <TableCell align="center">
                          {field.newRequired ? 
                            <CheckCircleIcon fontSize="small" color="success" /> : 
                            <CancelIcon fontSize="small" color="disabled" />
                          }
                        </TableCell>
                        <TableCell align="center">
                          {field.changed ? (
                            <Chip 
                              size="small" 
                              label={field.oldLength !== field.newLength ? "Cambio de longitud" : "Cambio obligatoriedad"} 
                              color="warning" 
                            />
                          ) : "Sin cambios"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Tabla de campos nuevos */}
              {item.newFields.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Campos nuevos (solo en Resolución 2275):
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, bgcolor: 'success.lighter' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Campo</TableCell>
                          <TableCell align="center">Tipo</TableCell>
                          <TableCell align="center">Longitud</TableCell>
                          <TableCell align="center">Obligatorio</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.newFields.map((field) => (
                          <TableRow key={field.name}>
                            <TableCell><strong>{field.name}</strong></TableCell>
                            <TableCell align="center">{field.type}</TableCell>
                            <TableCell align="center">{field.length}</TableCell>
                            <TableCell align="center">
                              {field.required ? 
                                <CheckCircleIcon fontSize="small" color="success" /> : 
                                <CancelIcon fontSize="small" color="disabled" />
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              {/* Tabla de campos eliminados */}
              {item.removedFields.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Campos eliminados (solo en Resolución 3374):
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'error.lighter' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Campo</TableCell>
                          <TableCell align="center">Tipo</TableCell>
                          <TableCell align="center">Longitud</TableCell>
                          <TableCell align="center">Obligatorio</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.removedFields.map((field) => (
                          <TableRow key={field.name}>
                            <TableCell><strong>{field.name}</strong></TableCell>
                            <TableCell align="center">{field.type}</TableCell>
                            <TableCell align="center">{field.length}</TableCell>
                            <TableCell align="center">
                              {field.required ? 
                                <CheckCircleIcon fontSize="small" color="success" /> : 
                                <CancelIcon fontSize="small" color="disabled" />
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

/**
 * Componente de guía de migración
 */
const MigrationGuide = () => {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Guía para la migración a la Resolución 2275/2023
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          A continuación se presentan los pasos recomendados para migrar sus sistemas a la nueva resolución.
        </Typography>
      </Alert>
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Consideraciones importantes
          </Typography>
          
          <Box component="ol" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body2" paragraph>
                <strong>Diagnósticos CIE-10:</strong> La nueva resolución requiere códigos de diagnóstico 
                de 6 caracteres en lugar de 4. Es necesario actualizar la base de datos de diagnósticos.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                <strong>Nuevos campos obligatorios:</strong> Varios archivos tienen nuevos campos obligatorios
                que deben ser capturados en el sistema (número de contrato, prefijo de factura, etc.).
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                <strong>Mayor longitud en campos de texto:</strong> Los campos de texto tienen mayor longitud 
                en la nueva resolución. Verificar que la base de datos y formularios soporten estas longitudes.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                <strong>Exportación en múltiples formatos:</strong> La nueva resolución permite la exportación
                en TXT, XML y CSV. Es recomendable implementar soporte para estos formatos.
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
      
      <Typography variant="subtitle2" gutterBottom>
        Plan de migración recomendado:
      </Typography>
      
      <Box component="ol" sx={{ pl: 3 }}>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Análisis de impacto:</strong> Identificar todos los componentes del sistema que deben ser modificados.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Actualización de base de datos:</strong> Modificar las tablas para soportar los nuevos campos y longitudes.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Actualización de formularios de captura:</strong> Añadir los nuevos campos requeridos en los formularios.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Implementación de validaciones:</strong> Adaptar las validaciones a los nuevos requisitos.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Desarrollo de exportación:</strong> Implementar la generación de archivos en los formatos requeridos.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Pruebas:</strong> Realizar pruebas exhaustivas con datos reales para garantizar la calidad.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" paragraph>
            <strong>Implementación gradual:</strong> Considerar un periodo de transición donde ambos formatos estén disponibles.
          </Typography>
        </li>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Alert severity="success">
          <Typography variant="subtitle2">
            Ventajas de la nueva resolución:
          </Typography>
          <Typography variant="body2">
            La Resolución 2275/2023 mejora la calidad y detalle de la información, facilita la 
            interoperabilidad entre sistemas y se adapta a las nuevas necesidades del sector salud.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default RipsComparisonGuide;