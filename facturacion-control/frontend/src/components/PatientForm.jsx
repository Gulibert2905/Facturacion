// src/components/PatientForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { validationService } from './services/validationService';
import { 
  documentTypes, 
  calculateAge, 
  getRecommendedDocumentType,
  validateDocumentTypeForAge,
  validateDocumentNumber,
  formatDocumentType
} from '../utils/documentValidation';

function PatientForm({ initialData, onSubmit }) {
  const [formData, setFormData] = useState({
    documentType: '',
    documentNumber: '',
    firstName: '',
    secondName: '',
    firstLastName: '',
    secondLastName: '',
    birthDate: null,
    gender: '',
    municipality: '',
    department: '',
    regimen: '',
    eps: '',
    zone: 'U',
    ...initialData
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [suggestedDocType, setSuggestedDocType] = useState('');
  const [documentValidation, setDocumentValidation] = useState({ isValid: true, message: '', severity: 'info' });
  const [numberValidation, setNumberValidation] = useState({ isValid: true, message: '', severity: 'info' });

  // Validar documento en tiempo real
  const validateDocumentInRealTime = () => {
    if (formData.birthDate && formData.documentType) {
      const age = calculateAge(formData.birthDate);
      const validation = validateDocumentTypeForAge(formData.documentType, age);
      setDocumentValidation(validation);
    }
    
    if (formData.documentNumber && formData.documentType) {
      const numValidation = validateDocumentNumber(formData.documentNumber, formData.documentType);
      setNumberValidation(numValidation);
    }
  };

  const validateForm = () => {
    const validation = validationService.validatePatient(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores de validación cuando el usuario empiece a escribir
    if (validationErrors.length > 0) {
      setTimeout(validateForm, 500);
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, birthDate: date }));
    
    if (date) {
      const age = calculateAge(date);
      const suggested = getRecommendedDocumentType(age);
      setSuggestedDocType(suggested);
      
      // Si el tipo de documento actual no es apropiado para la edad, mostrar validación
      if (suggested && formData.documentType) {
        const validation = validateDocumentTypeForAge(formData.documentType, age);
        setDocumentValidation(validation);
        
        if (!validation.isValid) {
          setAlertMessage(`${validation.message}`);
          setShowAlert(true);
        }
      }
    } else {
      setSuggestedDocType('');
      setDocumentValidation({ isValid: true, message: '', severity: 'info' });
    }
    
    if (validationErrors.length > 0) {
      setTimeout(validateForm, 500);
    }
  };

  // Manejar cambio de tipo de documento
  const handleDocumentTypeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, documentType: value }));
    
    // Validar inmediatamente si hay fecha de nacimiento
    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      const validation = validateDocumentTypeForAge(value, age);
      setDocumentValidation(validation);
    }
    
    // Validar número de documento si existe
    if (formData.documentNumber) {
      const numValidation = validateDocumentNumber(formData.documentNumber, value);
      setNumberValidation(numValidation);
    }
    
    if (validationErrors.length > 0) {
      setTimeout(validateForm, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setAlertMessage('Por favor corrija los errores de validación antes de continuar');
      setShowAlert(true);
      return;
    }
    
    try {
      await onSubmit(formData);
      setAlertMessage('Paciente guardado exitosamente');
      setShowAlert(true);
      setValidationErrors([]);
    } catch (error) {
      setAlertMessage('Error al guardar paciente');
      setShowAlert(true);
    }
  };

  useEffect(() => {
    validateDocumentInRealTime();
    if (formData.birthDate && formData.documentType) {
      validateForm();
    }
  }, [formData.birthDate, formData.documentType, formData.documentNumber]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  name="documentType"
                  value={formData.documentType || ''}
                  onChange={handleDocumentTypeChange}
                  required
                  error={!documentValidation.isValid}
                >
                  {documentTypes.map(option => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        backgroundColor: suggestedDocType === option.value ? 'success.light' : 'inherit',
                        color: suggestedDocType === option.value ? 'success.contrastText' : 'inherit'
                      }}
                    >
                      {option.label}
                      {suggestedDocType === option.value && ' ⭐ (Recomendado)'}
                    </MenuItem>
                  ))}
                </Select>
                {formData.birthDate && documentValidation.message && (
                  <Typography 
                    variant="caption" 
                    color={documentValidation.severity === 'error' ? 'error.main' : 'success.main'} 
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {documentValidation.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 15) { // Máximo 15 dígitos
                    setFormData(prev => ({ ...prev, documentNumber: value }));
                    
                    // Validar en tiempo real
                    if (formData.documentType) {
                      const validation = validateDocumentNumber(value, formData.documentType);
                      setNumberValidation(validation);
                    }
                  }
                  
                  if (validationErrors.length > 0) {
                    setTimeout(validateForm, 500);
                  }
                }}
                required
                error={!numberValidation.isValid}
                helperText={numberValidation.message || `Solo números (${formData.documentNumber?.length || 0}/15)`}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 15
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Primer Nombre"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Segundo Nombre"
                name="secondName"
                value={formData.secondName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Primer Apellido"
                name="firstLastName"
                value={formData.firstLastName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Segundo Apellido"
                name="secondLastName"
                value={formData.secondLastName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Fecha de Nacimiento"
                value={formData.birthDate}
                onChange={handleDateChange}
                renderInput={(params) => 
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={validationErrors.some(error => error.includes('nacimiento'))}
                    helperText={formData.birthDate ? `Edad: ${calculateAge(formData.birthDate)} años` : ''}
                  />
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Régimen</InputLabel>
                <Select
                  name="regimen"
                  value={formData.regimen || ''}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="Contributivo">Contributivo</MenuItem>
                  <MenuItem value="Subsidiado">Subsidiado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="EPS"
                name="eps"
                value={formData.eps}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Departamento"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Municipio"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
              />
            </Grid>

            {validationErrors.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Errores de validación:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                disabled={validationErrors.length > 0}
              >
                {initialData ? 'Actualizar' : 'Crear'} Paciente
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity={alertMessage.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}

export default PatientForm;