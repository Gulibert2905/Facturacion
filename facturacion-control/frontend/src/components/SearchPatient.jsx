// src/components/SearchPatient.jsx
import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { Search } from '@mui/icons-material';

function SearchPatient() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/patients/document/${documentNumber}`);
      const data = await response.json();
      
      if (response.ok) {
        setPatient(data);
        setError('');
      } else {
        setError(data.message || 'Paciente no encontrado');
        setPatient(null);
      }
    } catch (error) {
      setError('Error al buscar paciente');
      setPatient(null);
    }
  };

  return (
    <div>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Buscar Paciente
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Documento"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{ height: '56px' }}
            >
              Buscar
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {patient && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Nombre Completo
                  </Typography>
                  <Typography variant="body1">
                    {patient.fullName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Tipo de Documento
                  </Typography>
                  <Typography variant="body1">
                    {patient.documentType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Municipio
                  </Typography>
                  <Typography variant="body1">
                    {patient.municipality}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Régimen
                  </Typography>
                  <Typography variant="body1">
                    {patient.regimen}
                  </Typography>
                </Grid>
                {patient.birthDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fecha de Nacimiento
                    </Typography>
                    <Typography variant="body1">
                      {new Date(patient.birthDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Paper>
    </div>
  );
}

export default SearchPatient;