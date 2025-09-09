import React, { forwardRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.light}10 100%)`,
  border: `1px solid ${theme.palette.primary.light}40`,
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'visible',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: theme.spacing(2),
    zIndex: -1,
    opacity: 0.1
  }
}));

const PatientAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  fontSize: '2rem',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.action.hover,
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    fontSize: '1.1rem',
    opacity: 0.8
  }
}));

const ModernPatientCard = forwardRef(({ 
  patient, 
  onEdit,
  showActions = true,
  compact = false 
}, ref) => {
  const theme = useTheme();

  if (!patient) return null;

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No especificada';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getPatientName = () => {
    if (patient.fullName) return patient.fullName;
    
    const parts = [
      patient.firstName,
      patient.secondName,
      patient.firstLastName,
      patient.secondLastName
    ].filter(part => part && part.trim());
    
    return parts.length > 0 ? parts.join(' ') : 'Sin nombre disponible';
  };

  const getInitials = () => {
    const name = getPatientName();
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return words[0] ? words[0][0].toUpperCase() : 'P';
  };

  const getAgeFromBirthDate = () => {
    if (!patient.birthDate) return null;
    try {
      const birth = new Date(patient.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
      }
      return age;
    } catch (error) {
      return null;
    }
  };

  const age = getAgeFromBirthDate();

  return (
    <StyledCard ref={ref} elevation={3}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" flex={1}>
            <PatientAvatar>
              {getInitials()}
            </PatientAvatar>
            
            <Box ml={2} flex={1}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <Typography 
                  variant="h5" 
                  fontWeight={700}
                  color="text.primary"
                  sx={{ mr: 1 }}
                >
                  {getPatientName()}
                </Typography>
                <VerifiedIcon color="primary" fontSize="small" />
              </Box>
              
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                fontWeight={500}
              >
                CC: {patient.documentNumber}
              </Typography>

              <Stack direction="row" spacing={1} mt={1}>
                <Chip
                  label={patient.regimen || 'Sin régimen'}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                {age && (
                  <Chip
                    label={`${age} años`}
                    color="secondary"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Stack>
            </Box>
          </Box>

          {showActions && (
            <Tooltip title="Editar información">
              <IconButton
                onClick={() => onEdit?.(patient)}
                color="primary"
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.5}>
          <InfoItem>
            <CalendarIcon color="action" />
            <Box>
              <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                FECHA DE NACIMIENTO
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDate(patient.birthDate)}
              </Typography>
            </Box>
          </InfoItem>

          <InfoItem>
            <LocationIcon color="action" />
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                CIUDADES
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                <strong>Nacimiento:</strong> {patient.ciudadNacimiento || 'No especificada'}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                <strong>Expedición:</strong> {patient.ciudadExpedicion || 'No especificada'}
              </Typography>
            </Box>
          </InfoItem>

          {patient.regimen && (
            <InfoItem>
              <AssignmentIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                  RÉGIMEN DE SALUD
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {patient.regimen}
                </Typography>
              </Box>
            </InfoItem>
          )}
        </Stack>

        {/* Indicador de estado */}
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 1.5,
            backgroundColor: 'success.light',
            color: 'success.contrastText',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            ✓ Paciente verificado y listo para facturación
          </Typography>
        </Paper>
      </CardContent>
    </StyledCard>
  );
});

ModernPatientCard.displayName = 'ModernPatientCard';

export default ModernPatientCard;