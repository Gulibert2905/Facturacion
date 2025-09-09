import React, { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Zoom,
  useTheme
} from '@mui/material';
import {
  ViewList as ClassicIcon,
  AutoAwesome as ModernIcon,
  Star as StarIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: `${theme.spacing(1.5)} !important`,
    margin: theme.spacing(0.5),
    padding: theme.spacing(1.5, 2),
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-1px)'
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      }
    }
  }
}));

const VersionCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected 
    ? `2px solid ${theme.palette.primary.main}`
    : `1px solid ${theme.palette.divider}`,
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.background.paper})`
    : theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    borderColor: theme.palette.primary.main
  }
}));

const FeatureChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.75rem',
  height: 24
}));

const ServiceVersionToggle = ({ 
  currentVersion, 
  onVersionChange,
  showComparison = true 
}) => {
  const theme = useTheme();
  const [selectedVersion, setSelectedVersion] = useState(currentVersion || 'classic');

  const handleVersionChange = (event, newVersion) => {
    if (newVersion !== null) {
      setSelectedVersion(newVersion);
      onVersionChange?.(newVersion);
    }
  };

  const versions = {
    classic: {
      label: 'Versión Clásica',
      icon: ClassicIcon,
      description: 'Interfaz tradicional con tablas y formularios estándar',
      features: ['Tabla de datos', 'Formularios básicos', 'Funcionalidad completa'],
      color: 'default',
      performance: 'Estándar'
    },
    modern: {
      label: 'Versión Moderna',
      icon: ModernIcon,
      description: 'Interfaz renovada con cards, animaciones y mejor UX',
      features: ['Cards interactivas', 'Animaciones suaves', 'Diseño responsivo', 'Stepper guiado'],
      color: 'primary',
      performance: 'Optimizada',
      isNew: true
    }
  };

  if (showComparison) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom textAlign="center" fontWeight={600}>
          Elige tu experiencia de usuario
        </Typography>
        
        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          {Object.entries(versions).map(([key, version]) => (
            <Zoom in key={key} timeout={600}>
              <VersionCard
                selected={selectedVersion === key}
                onClick={() => handleVersionChange(null, key)}
                elevation={selectedVersion === key ? 8 : 2}
                sx={{ minWidth: 280, maxWidth: 320 }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <version.icon 
                    color={selectedVersion === key ? 'primary' : 'action'}
                    sx={{ mr: 1, fontSize: '1.5rem' }}
                  />
                  <Typography variant="h6" fontWeight={600}>
                    {version.label}
                  </Typography>
                  {version.isNew && (
                    <Tooltip title="¡Nueva funcionalidad!">
                      <StarIcon 
                        color="warning" 
                        sx={{ ml: 1, fontSize: '1.2rem' }}
                      />
                    </Tooltip>
                  )}
                </Box>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, minHeight: 40 }}
                >
                  {version.description}
                </Typography>

                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    CARACTERÍSTICAS:
                  </Typography>
                  <Box mt={0.5}>
                    {version.features.map((feature, index) => (
                      <FeatureChip
                        key={index}
                        label={feature}
                        size="small"
                        variant="outlined"
                        color={selectedVersion === key ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <SpeedIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {version.performance}
                    </Typography>
                  </Box>
                  
                  {selectedVersion === key && (
                    <Chip
                      label="Seleccionado"
                      color="primary"
                      size="small"
                      variant="filled"
                    />
                  )}
                </Box>
              </VersionCard>
            </Zoom>
          ))}
        </Box>
      </Box>
    );
  }

  // Versión compacta - solo toggle
  return (
    <Box display="flex" justifyContent="center" mb={2}>
      <StyledToggleButtonGroup
        value={selectedVersion}
        exclusive
        onChange={handleVersionChange}
        aria-label="version selector"
      >
        <ToggleButton value="classic" aria-label="classic version">
          <ClassicIcon sx={{ mr: 1 }} />
          Clásica
        </ToggleButton>
        <ToggleButton value="modern" aria-label="modern version">
          <ModernIcon sx={{ mr: 1 }} />
          Moderna
          {versions.modern.isNew && (
            <StarIcon sx={{ ml: 1, fontSize: '1rem' }} />
          )}
        </ToggleButton>
      </StyledToggleButtonGroup>
    </Box>
  );
};

export default ServiceVersionToggle;