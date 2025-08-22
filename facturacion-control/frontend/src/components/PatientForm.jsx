// src/components/PatientForm.jsx
import React, { useState } from 'react';
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
  Snackbar
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

function PatientForm({ initialData, onSubmit }) {
  const [formData, setFormData] = useState(initialData || {
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
    zone: 'U'
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setAlertMessage('Paciente guardado exitosamente');
      setShowAlert(true);
    } catch (error) {
      setAlertMessage('Error al guardar paciente');
      setShowAlert(true);
    }
  };

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
                  value={formData.documentType}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
                  <MenuItem value="TI">Tarjeta de Identidad</MenuItem>
                  <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                  <MenuItem value="PA">Pasaporte</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
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
                onChange={(date) => setFormData(prev => ({ ...prev, birthDate: date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Régimen</InputLabel>
                <Select
                  name="regimen"
                  value={formData.regimen}
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

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
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