import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepIcon,
  Box,
  Typography,
  Paper,
  useTheme
} from '@mui/material';
import {
  Business as CompanyIcon,
  Assignment as ContractIcon,
  Person as PersonIcon,
  LocalHospital as ServiceIcon,
  CheckCircle as CompleteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ModernStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStep-root': {
    padding: theme.spacing(1, 0),
  },
  '& .MuiStepLabel-root': {
    '& .MuiStepLabel-iconContainer': {
      paddingRight: theme.spacing(2),
    }
  },
  '& .MuiStepLabel-labelContainer': {
    '& .MuiStepLabel-label': {
      fontWeight: 600,
      fontSize: '1rem',
      '&.Mui-active': {
        color: theme.palette.primary.main,
        fontWeight: 700
      },
      '&.Mui-completed': {
        color: theme.palette.success.main,
        fontWeight: 600
      }
    }
  }
}));

const CustomStepIcon = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: 
    ownerState.completed ? theme.palette.success.main :
    ownerState.active ? theme.palette.primary.main :
    theme.palette.grey[300],
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: ownerState.active || ownerState.completed 
    ? '0 4px 12px rgba(0,0,0,0.2)' 
    : '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  transform: ownerState.active ? 'scale(1.1)' : 'scale(1)',
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem'
  }
}));

const StepContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'active'
})(({ theme, active }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  border: active 
    ? `2px solid ${theme.palette.primary.main}` 
    : `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  background: active 
    ? `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.background.paper})` 
    : theme.palette.background.paper,
  transition: 'all 0.3s ease',
  boxShadow: active ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
}));

const ModernProcessStepper = ({
  activeStep,
  steps,
  orientation = 'vertical'
}) => {
  const theme = useTheme();

  const stepIcons = {
    0: CompanyIcon,
    1: ContractIcon,
    2: PersonIcon,
    3: ServiceIcon,
    4: CompleteIcon
  };

  const defaultSteps = [
    {
      label: 'Seleccionar Empresa',
      description: 'Elija la empresa para la cual va a facturar',
      completed: activeStep > 0
    },
    {
      label: 'Elegir Contrato',
      description: 'Seleccione el contrato correspondiente',
      completed: activeStep > 1
    },
    {
      label: 'Buscar Paciente',
      description: 'Ingrese el documento del paciente',
      completed: activeStep > 2
    },
    {
      label: 'Gestionar Servicios',
      description: 'Seleccione los servicios a facturar',
      completed: activeStep > 3
    },
    {
      label: 'Finalizar',
      description: 'Complete y exporte la prefacturación',
      completed: activeStep > 4
    }
  ];

  const stepsToShow = steps || defaultSteps;

  const CustomIcon = ({ icon, ...props }) => {
    const IconComponent = stepIcons[icon] || ServiceIcon;
    return (
      <CustomStepIcon ownerState={props}>
        {props.completed ? <CompleteIcon /> : <IconComponent />}
      </CustomStepIcon>
    );
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          fontWeight: 700,
          color: 'text.primary',
          textAlign: 'center'
        }}
      >
        Proceso de Facturación
      </Typography>

      <ModernStepper 
        activeStep={activeStep} 
        orientation={orientation}
        sx={{ 
          '& .MuiStepConnector-line': {
            borderColor: theme.palette.divider,
            borderLeftWidth: 2,
            marginLeft: 25
          },
          '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
            borderColor: theme.palette.primary.main
          },
          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
            borderColor: theme.palette.success.main
          }
        }}
      >
        {stepsToShow.map((step, index) => (
          <Step key={step.label} completed={step.completed}>
            <StepLabel
              StepIconComponent={(props) => (
                <CustomIcon 
                  icon={index} 
                  active={props.active} 
                  completed={props.completed} 
                />
              )}
            >
              <StepContainer active={activeStep === index} elevation={0}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {step.label}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {step.description}
                </Typography>
                
                {/* Indicador de progreso */}
                {activeStep === index && (
                  <Box
                    sx={{
                      mt: 1,
                      height: 3,
                      borderRadius: 1.5,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      animation: 'pulse 2s infinite'
                    }}
                  />
                )}
              </StepContainer>
            </StepLabel>
          </Step>
        ))}
      </ModernStepper>
    </Box>
  );
};

export default ModernProcessStepper;