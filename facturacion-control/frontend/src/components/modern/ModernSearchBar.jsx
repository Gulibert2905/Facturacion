import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Fade,
  Paper,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  QrCodeScanner as ScanIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { 
  calculateAge, 
  getRecommendedDocumentType,
  validateDocumentTypeForAge,
  validateDocumentNumber 
} from '../../utils/documentValidation';

const SearchContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    '&.Mui-focused': {
      boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2
      }
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '1.1rem',
    fontWeight: 500
  }
}));

const RecentSearches = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  '& .MuiChip-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[4]
    }
  }
}));

const ModernSearchBar = ({ 
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Buscar paciente por documento...",
  loading = false,
  recentSearches = [],
  onRecentSearchClick,
  helperText,
  error = false
}) => {
  const [focused, setFocused] = useState(false);

  const validateDocument = (doc) => {
    if (!doc) return { isValid: false, message: '' };
    const cleaned = doc.replace(/\D/g, '');
    
    if (cleaned.length < 6) {
      return { isValid: false, message: 'Mínimo 6 dígitos' };
    }
    if (cleaned.length > 15) {
      return { isValid: false, message: 'Máximo 15 dígitos (ajustado para RC)' };
    }
    
    // Mensaje más descriptivo según longitud
    if (cleaned.length >= 6 && cleaned.length <= 7) {
      return { isValid: true, message: `${cleaned.length} dígitos - Posible RC` };
    }
    if (cleaned.length >= 8 && cleaned.length <= 11) {
      return { isValid: true, message: `${cleaned.length} dígitos - Posible TI/CC` };
    }
    if (cleaned.length >= 12) {
      return { isValid: true, message: `${cleaned.length} dígitos - Posible CC/RC` };
    }
    
    return { isValid: true, message: `${cleaned.length} dígitos` };
  };

  const validation = validateDocument(value);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && validation.isValid) {
      onSearch(value);
    }
  };

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    // Solo permitir números
    const cleaned = inputValue.replace(/\D/g, '');
    if (cleaned.length <= 15) { // Aumentado para soportar RC más largos
      onChange(cleaned);
    }
  };

  return (
    <SearchContainer elevation={0}>
      <Box display="flex" alignItems="center" mb={2}>
        <PersonIcon color="primary" sx={{ mr: 1, fontSize: '1.5rem' }} />
        <Typography variant="h6" fontWeight={600} color="text.primary">
          Búsqueda de Paciente
        </Typography>
      </Box>

      <StyledTextField
        fullWidth
        variant="outlined"
        label={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        error={Boolean(error || (value && !validation.isValid))}
        helperText={
          error 
            ? helperText 
            : value 
              ? validation.message 
              : "Ingrese el número de documento (6-15 dígitos)"
        }
        inputProps={{
          maxLength: 15,
          inputMode: 'numeric',
          pattern: '[0-9]*'
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color={focused ? 'primary' : 'action'} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box display="flex" alignItems="center" gap={0.5}>
                {loading && (
                  <CircularProgress size={20} color="primary" />
                )}
                
                <Tooltip title="Escanear documento">
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                      <ScanIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {value && (
                  <Fade in={!!value}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        onChange('');
                        onClear?.();
                      }}
                      sx={{ 
                        color: 'error.main',
                        '&:hover': { 
                          backgroundColor: 'error.light',
                          color: 'error.contrastText'
                        }
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Fade>
                )}

                <Tooltip title={validation.isValid ? "Buscar paciente" : "Documento inválido"}>
                  <span>
                    <IconButton
                      color="primary"
                      disabled={!validation.isValid || loading}
                      onClick={() => onSearch(value)}
                      sx={{
                        background: validation.isValid 
                          ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                          : 'transparent',
                        color: validation.isValid ? 'white' : 'inherit',
                        '&:hover': validation.isValid ? {
                          background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                          transform: 'scale(1.05)'
                        } : {},
                        '&:disabled': {
                          background: 'transparent',
                          color: 'action.disabled'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </InputAdornment>
          )
        }}
      />

      {/* Búsquedas recientes */}
      {recentSearches && recentSearches.length > 0 && (
        <Fade in={focused || recentSearches.length > 0}>
          <RecentSearches>
            <Box display="flex" alignItems="center" mb={1}>
              <HistoryIcon 
                fontSize="small" 
                color="action" 
                sx={{ mr: 0.5 }} 
              />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Búsquedas recientes:
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {recentSearches.slice(0, 5).map((search, index) => (
                <Chip
                  key={index}
                  label={search}
                  variant="outlined"
                  size="small"
                  clickable
                  onClick={() => onRecentSearchClick?.(search)}
                  sx={{
                    borderRadius: 16,
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                />
              ))}
            </Box>
          </RecentSearches>
        </Fade>
      )}

      {/* Indicador de estado */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: validation.isValid 
            ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
            : value 
              ? 'linear-gradient(90deg, #FF9800, #FFC107)'
              : 'linear-gradient(90deg, #E0E0E0, #BDBDBD)',
          transition: 'all 0.3s ease'
        }}
      />
    </SearchContainer>
  );
};

export default ModernSearchBar;