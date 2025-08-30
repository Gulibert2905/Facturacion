// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Link,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { 
  Email, 
  ArrowBack, 
  CheckCircle,
  Security
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { apiService } from '../components/services/apiService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Ingresa tu email', 'Revisa tu correo', 'Instrucciones enviadas'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    setActiveStep(1);

    try {
      const response = await apiService.post('/auth/forgot-password', {
        email: email.toLowerCase().trim()
      });

      console.log('Forgot password response:', response);
      setSuccess(true);
      setActiveStep(2);

    } catch (error) {
      console.error('Error in forgot password:', error);
      
      let errorMessage = 'Error enviando solicitud. Intente nuevamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    setActiveStep(0);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box textAlign="center" mb={3}>
          <Security color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            Recuperar Contraseña
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Te enviaremos instrucciones para restablecer tu contraseña
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box textAlign="center">
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ¡Instrucciones Enviadas!
              </Typography>
              <Typography variant="body2">
                Hemos enviado un enlace de recuperación a tu email.
                <br />
                <strong>Revisa tu bandeja de entrada y spam.</strong>
              </Typography>
            </Alert>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.contrastText">
                <strong>En desarrollo:</strong> Revisa la consola del backend para ver el enlace de recuperación simulado.
              </Typography>
            </Box>

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={handleTryAgain}
                startIcon={<Email />}
              >
                Enviar Otro Email
              </Button>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                startIcon={<ArrowBack />}
              >
                Volver al Login
              </Button>
            </Box>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              placeholder="tu@email.com"
              helperText="Ingresa el email asociado a tu cuenta"
              InputProps={{
                startAdornment: <Email color="action" sx={{ mr: 1 }} />
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
              startIcon={loading ? <CircularProgress size={20} /> : <Email />}
            >
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </Button>
          </form>
        )}

        {!success && (
          <Box textAlign="center" mt={3}>
            <Link
              component={RouterLink}
              to="/login"
              sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
            >
              <ArrowBack fontSize="small" />
              Volver al Login
            </Link>
          </Box>
        )}

        {process.env.NODE_ENV === 'development' && (
          <Box mt={4} p={2} bgcolor="grey.100" borderRadius={1}>
            <Typography variant="caption" display="block" gutterBottom>
              <strong>Emails de Prueba (Solo Desarrollo):</strong>
            </Typography>
            <Typography variant="caption" display="block">
              • admin@facturacion.test
            </Typography>
            <Typography variant="caption" display="block">
              • facturador@facturacion.test
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;