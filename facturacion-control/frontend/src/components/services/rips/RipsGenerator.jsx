// src/pages/RipsGenerator.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 

  Tabs, 
  Tab, 
  Box, 
  Button,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
  
} from '@mui/material';
import { useLoading } from '../../../contexts/LoadingContext';
import ripsService from './ripsService';

// Componentes para cada paso
import RipsFileSelector from './RipsFileSelector';
import RipsValidator from './RipsValidator';
import RipsExportOptions from './RipsExportOptions';

// Pasos del proceso de generación de RIPS
const steps = [
  'Configuración y selección de datos',
  'Validación previa',
  'Generación y exportación'
];

const RipsGenerator = () => {
  // Estado global de carga
  const { setLoading } = useLoading();
  
  // Estados locales
  const [activeStep, setActiveStep] = useState(0);
  const [resolution, setResolution] = useState('3374');
  const [ripsData, setRipsData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [generatedRipsId, setGeneratedRipsId] = useState(null);
  const [error, setError] = useState(null);

  // Cambiar resolución RIPS
  const handleResolutionChange = (event, newValue) => {
    setResolution(newValue);
    // Resetear datos al cambiar de resolución
    setRipsData(null);
    setValidationResults(null);
    setGeneratedRipsId(null);
  };

  // Avanzar al siguiente paso
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Retroceder al paso anterior
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Actualizar datos de configuración RIPS
  const handleDataChange = (data) => {
    setRipsData(data);
  };

  // Validar datos RIPS
  const handleValidate = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await ripsService.validateRipsData(ripsData, resolution);
      setValidationResults(results);
      if (results.isValid) {
        handleNext();
      }
    } catch (err) {
      setError('Error en la validación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generar RIPS
  const handleGenerate = async (format = 'TXT') => {
    try {
      setLoading(true);
      setError(null);
      const result = await ripsService.generateRips(ripsData, resolution);
      setGeneratedRipsId(result.id);
      
      // Exportar inmediatamente si se solicita
      if (format) {
        await ripsService.exportRips(result.id, format, resolution);
      }
    } catch (err) {
      setError('Error en la generación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el paso actual
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <RipsFileSelector 
            resolution={resolution}
            onChange={handleDataChange}
            data={ripsData}
          />
        );
      case 1:
        return (
          <RipsValidator 
            resolution={resolution}
            data={ripsData}
            validationResults={validationResults}
            onValidate={handleValidate}
          />
        );
      case 2:
        return (
          <RipsExportOptions 
            resolution={resolution}
            ripsId={generatedRipsId}
            onGenerate={handleGenerate}
          />
        );
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Generación de RIPS
        </Typography>
        
        {/* Selector de resolución */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={resolution} 
            onChange={handleResolutionChange}
            centered
          >
            <Tab label="Resolución 3374 de 2000" value="3374" />
            <Tab label="Resolución 2275 de 2023" value="2275" />
          </Tabs>
        </Paper>

        {/* Stepper para proceso de generación */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Mensajes de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Contenido según el paso actual */}
        <Box sx={{ mt: 2, mb: 2 }}>
          {renderStepContent()}
        </Box>

        {/* Botones de navegación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Atrás
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === 1 ? handleValidate : handleNext}
            disabled={
              (activeStep === 0 && !ripsData) || 
              (activeStep === 2 && !generatedRipsId)
            }
          >
            {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RipsGenerator;