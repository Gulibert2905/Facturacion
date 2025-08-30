// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Security, 
  ArrowBack, 
  CheckCircle,
  Visibility,
  VisibilityOff,
  Warning
} from '@mui/icons-material';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../components/services/apiService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false
  });

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido o faltante');
    }
  }, [token]);

  const handleTogglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    return {
      valid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      issues: [
        !minLength && 'Mínimo 12 caracteres',
        !hasUpper && 'Al menos 1 mayúscula',
        !hasLower && 'Al menos 1 minúscula', 
        !hasNumber && 'Al menos 1 número',
        !hasSpecial && 'Al menos 1 carácter especial (@$!%*?&)'
      ].filter(Boolean)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(`Contraseña no válida: ${passwordValidation.issues.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.post('/auth/reset-password', {
        token,
        password
      });

      console.log('Reset password response:', response);
      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Contraseña restablecida exitosamente. Puedes iniciar sesión.' 
          }
        });
      }, 3000);

    } catch (error) {
      console.error('Error resetting password:', error);
      
      let errorMessage = 'Error restableciendo contraseña. Intente nuevamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Manejar casos específicos
      if (errorMessage.includes('inválido') || errorMessage.includes('expirado')) {
        errorMessage += ' Solicita un nuevo enlace de recuperación.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

  if (!token) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Box textAlign="center">
            <Warning color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Enlace Inválido
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              El enlace de recuperación no es válido o ha expirado.
            </Typography>
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="contained"
              startIcon={<Security />}
            >
              Solicitar Nuevo Enlace
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box textAlign="center" mb={3}>
          <Security color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            Nueva Contraseña
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ingresa tu nueva contraseña segura
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            {(error.includes('inválido') || error.includes('expirado')) && (
              <Box mt={1}>
                <Link component={RouterLink} to="/forgot-password">
                  Solicitar nuevo enlace de recuperación
                </Link>
              </Box>
            )}
          </Alert>
        )}

        {success ? (
          <Box textAlign="center">
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ¡Contraseña Restablecida!
              </Typography>
              <Typography variant="body2">
                Tu contraseña ha sido cambiada exitosamente.
                <br />
                <strong>Serás redirigido al login en unos segundos...</strong>
              </Typography>
            </Alert>

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              startIcon={<ArrowBack />}
            >
              Ir al Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nueva Contraseña"
              type={showPasswords.password ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              error={password && !passwordValidation.valid}
              helperText={
                password && !passwordValidation.valid
                  ? passwordValidation.issues.join(', ')
                  : 'Mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleTogglePasswordVisibility('password')}
                      edge="end"
                    >
                      {showPasswords.password ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Confirmar Nueva Contraseña"
              type={showPasswords.confirm ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              error={confirmPassword && password !== confirmPassword}
              helperText={
                confirmPassword && password !== confirmPassword
                  ? 'Las contraseñas no coinciden'
                  : 'Confirma tu nueva contraseña'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleTogglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {password && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Fortaleza de la contraseña:
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  {passwordValidation.valid ? (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      ✅ Contraseña segura
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ width: '100%' }}>
                      ⚠️ Contraseña débil
                    </Alert>
                  )}
                </Box>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || !passwordValidation.valid || password !== confirmPassword}
              sx={{ mt: 3, mb: 2 }}
              startIcon={loading ? <CircularProgress size={20} /> : <Security />}
            >
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
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
      </Paper>
    </Container>
  );
};

export default ResetPassword;