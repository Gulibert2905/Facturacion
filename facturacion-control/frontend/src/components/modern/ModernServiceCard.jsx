import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Stack,
  Fade,
  useTheme
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isPrefactured'
})(({ theme, isPrefactured }) => ({
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: isPrefactured ? 'default' : 'pointer',
  background: isPrefactured 
    ? `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 100%)`
    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  border: `1px solid ${isPrefactured ? theme.palette.grey[300] : 'transparent'}`,
  overflow: 'visible',
  '&:hover': {
    transform: isPrefactured ? 'none' : 'translateY(-4px)',
    boxShadow: isPrefactured 
      ? theme.shadows[2] 
      : '0 12px 24px rgba(0,0,0,0.15)',
    '& .add-button': {
      transform: 'scale(1.1)',
      boxShadow: theme.shadows[8]
    }
  },
  '&::before': isPrefactured ? {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
    borderRadius: theme.shape.borderRadius,
    zIndex: -1,
    opacity: 0.3
  } : {}
}));

const ServiceHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2)
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.action.hover,
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(0.5),
    fontSize: '1.1rem'
  }
}));

const ModernServiceCard = ({ 
  service, 
  onAddToPreBill, 
  onViewDetails,
  showValue = false,
  animate = true 
}) => {
  const theme = useTheme();
  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getStatusColor = () => {
    if (service.isPrefactured) return 'success';
    if (service.requiresAuthorization) return 'warning';
    return 'primary';
  };

  const getStatusLabel = () => {
    if (service.isPrefactured) return 'Prefacturado';
    if (service.requiresAuthorization) return 'Requiere Autorización';
    return 'Disponible';
  };

  return (
    <Fade in={true} timeout={animate ? 800 : 0}>
      <StyledCard 
        elevation={service.isPrefactured ? 1 : 3}
        isPrefactured={service.isPrefactured}
      >
        <CardContent>
          <ServiceHeader>
            <Box display="flex" alignItems="center">
              <HospitalIcon 
                color={service.isPrefactured ? 'disabled' : 'primary'} 
                sx={{ mr: 1 }}
              />
              <Typography 
                variant="h6" 
                color={service.isPrefactured ? 'text.secondary' : 'text.primary'}
                sx={{ fontWeight: 600 }}
              >
                {service.cupsCode}
              </Typography>
            </Box>
            <Chip 
              label={getStatusLabel()}
              color={getStatusColor()}
              size="small"
              variant={service.isPrefactured ? 'filled' : 'outlined'}
              sx={{ fontWeight: 500 }}
            />
          </ServiceHeader>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2, 
              minHeight: '2.4em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {service.description || 'Sin descripción disponible'}
          </Typography>

          <Stack spacing={1}>
            <MetricBox>
              <ScheduleIcon color="action" />
              <Typography variant="body2" fontWeight={500}>
                {formatDate(service.serviceDate)}
              </Typography>
            </MetricBox>

            {showValue && (
              <MetricBox>
                <MoneyIcon color="action" />
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(service.value)}
                </Typography>
              </MetricBox>
            )}

            {service.prefacturedAt && (
              <MetricBox sx={{ backgroundColor: theme.palette.success.light + '20' }}>
                <CheckIcon color="success" />
                <Typography variant="body2" fontWeight={500} color="success.main">
                  Procesado {formatDate(service.prefacturedAt)}
                </Typography>
              </MetricBox>
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
          <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
            <Tooltip title="Ver detalles">
              <IconButton 
                size="small" 
                onClick={() => onViewDetails?.(service)}
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {service.isPrefactured ? (
              <Button
                variant="outlined"
                disabled
                startIcon={<CheckIcon />}
                sx={{ 
                  borderRadius: 20,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Ya Procesado
              </Button>
            ) : (
              <Button
                variant="contained"
                size="medium"
                className="add-button"
                startIcon={<AddIcon />}
                onClick={() => onAddToPreBill(service)}
                sx={{ 
                  borderRadius: 20,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  }
                }}
              >
                Agregar
              </Button>
            )}
          </Box>
        </CardActions>

        {/* Decorative elements */}
        {!service.isPrefactured && (
          <Box
            sx={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
              opacity: 0.8,
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </StyledCard>
    </Fade>
  );
};

export default ModernServiceCard;