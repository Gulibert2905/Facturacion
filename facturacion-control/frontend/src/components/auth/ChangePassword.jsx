// src/components/auth/ChangePassword.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Security,
  CheckCircle 
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

const ChangePassword = ({ open, onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

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
    setSuccess('');

    // Validaciones frontend
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(`Contraseña no válida: ${passwordValidation.issues.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      setSuccess('Contraseña cambiada exitosamente');
      
      // Limpiar formulario después de 2 segundos y cerrar
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
        setError('');
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      
      let errorMessage = 'Error cambiando contraseña. Intente nuevamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  const passwordValidation = validatePassword(newPassword);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Security color="primary" />
          <Typography variant="h6">
            Cambiar Contraseña
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              icon={<CheckCircle />}
            >
              {success}
            </Alert>
          )}

          <TextField
            label="Contraseña Actual"
            type={showPasswords.current ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleTogglePasswordVisibility('current')}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Nueva Contraseña"
            type={showPasswords.new ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
            error={newPassword && !passwordValidation.valid}
            helperText={
              newPassword && !passwordValidation.valid
                ? passwordValidation.issues.join(', ')
                : 'Mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos'
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleTogglePasswordVisibility('new')}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
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
            error={confirmPassword && newPassword !== confirmPassword}
            helperText={
              confirmPassword && newPassword !== confirmPassword
                ? 'Las contraseñas no coinciden'
                : ''
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

          {newPassword && (
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
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading || !passwordValidation.valid || newPassword !== confirmPassword}
            startIcon={loading ? <CircularProgress size={20} /> : <Security />}
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePassword;