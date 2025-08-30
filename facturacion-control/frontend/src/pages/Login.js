// src/pages/Login.js
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Paper, 
  Typography, 
  Alert, 
  CircularProgress,
  Link,
  Box,
  Divider
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestCredentials, setShowTestCredentials] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login attempt:', { username: username.substring(0, 3) + '***' });
      const response = await login(username, password);
      
      console.log('Login successful:', response.user?.fullName);
      
      // Redirigir al dashboard después del login exitoso
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Manejar diferentes tipos de errores del backend
      let errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
      
      if (error.response?.data) {
        const { message, code, attemptsRemaining, retryAfter } = error.response.data;
        
        switch (code) {
          case 'INVALID_CREDENTIALS':
            errorMessage = `${message}${attemptsRemaining !== undefined ? ` (${attemptsRemaining} intentos restantes)` : ''}`;
            break;
          case 'USER_LOCKED':
            errorMessage = message;
            break;
          case 'USER_INACTIVE':
            errorMessage = 'Cuenta desactivada. Contacte al administrador.';
            break;
          default:
            errorMessage = message || errorMessage;
        }
        
        if (retryAfter) {
          errorMessage += ` Intente nuevamente en ${Math.ceil(retryAfter / 60)} minutos.`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCredentials = (testUsername, testPassword) => {
    setUsername(testUsername);
    setPassword(testPassword);
    setShowTestCredentials(false);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} style={{ padding: '2rem', marginTop: '2rem' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Sistema de Facturación
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          Iniciar Sesión
        </Typography>
        
        {error && (
          <Alert severity="error" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Usuario"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            helperText="Ingrese su nombre de usuario o email"
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            helperText="Mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            style={{ marginTop: '1rem', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} style={{ marginRight: '0.5rem' }} />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>

        <Divider style={{ marginY: '1rem' }} />
        
        <Box textAlign="center" marginTop="1rem">
          <Link 
            component={RouterLink}
            to="/forgot-password"
            style={{ textDecoration: 'none' }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>

        {process.env.NODE_ENV === 'development' && (
          <Box marginTop="2rem">
            <Divider style={{ marginBottom: '1rem' }} />
            <Typography variant="caption" display="block" gutterBottom align="center">
              Credenciales de Prueba (Solo Desarrollo)
            </Typography>
            
            {!showTestCredentials ? (
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => setShowTestCredentials(true)}
              >
                Mostrar Credenciales de Prueba
              </Button>
            ) : (
              <Box>
                <Button 
                  variant="text" 
                  size="small" 
                  fullWidth 
                  style={{ marginBottom: '0.5rem' }}
                  onClick={() => handleTestCredentials('admin', 'Admin123!@#')}
                >
                  👑 admin / Admin123!@# (Administrador)
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  fullWidth
                  onClick={() => handleTestCredentials('facturador1', 'Factura123!@#')}
                >
                  📊 facturador1 / Factura123!@# (Facturador)
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setShowTestCredentials(false)}
                >
                  Ocultar
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default Login;