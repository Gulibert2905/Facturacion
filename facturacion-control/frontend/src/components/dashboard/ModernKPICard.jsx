import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';

const ModernKPICard = ({
  title,
  value,
  subtitle,
  icon: IconComponent,
  trend,
  trendValue,
  color = 'primary',
  progress,
  unit = '',
  gradient = false
}) => {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp sx={{ fontSize: 16 }} />;
    if (trend < 0) return <TrendingDown sx={{ fontSize: 16 }} />;
    return <TrendingFlat sx={{ fontSize: 16 }} />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'success.main';
    if (trend < 0) return 'error.main';
    return 'text.secondary';
  };

  const getGradient = () => {
    const gradients = {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      error: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    };
    return gradients[color] || gradients.primary;
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: gradient ? getGradient() : 'background.paper',
        color: gradient ? 'white' : 'text.primary',
        boxShadow: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        '&::before': gradient ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.1)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        } : {},
        '&:hover::before': gradient ? {
          opacity: 1,
        } : {}
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header con ícono */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500,
              color: gradient ? 'rgba(255,255,255,0.9)' : 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            {title}
          </Typography>
          <Avatar
            sx={{
              background: gradient 
                ? 'rgba(255,255,255,0.2)' 
                : `${color}.light`,
              color: gradient ? 'white' : `${color}.contrastText`,
              width: 48,
              height: 48,
              boxShadow: 2
            }}
          >
            <IconComponent />
          </Avatar>
        </Box>

        {/* Valor principal */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: gradient ? 'white' : 'text.primary',
              fontSize: { xs: '1.8rem', md: '2.2rem' },
              lineHeight: 1.2
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
            <Typography
              component="span"
              variant="h5"
              sx={{
                color: gradient ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                ml: 0.5,
                fontWeight: 400
              }}
            >
              {unit}
            </Typography>
          </Typography>
        </Box>

        {/* Subtitle y tendencia */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: gradient ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                fontSize: '0.85rem'
              }}
            >
              {subtitle}
            </Typography>
          )}
          
          {trendValue !== undefined && (
            <Chip
              icon={getTrendIcon()}
              label={`${trendValue > 0 ? '+' : ''}${trendValue}%`}
              size="small"
              sx={{
                background: gradient ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: gradient ? 'white' : getTrendColor(),
                border: gradient ? 'none' : `1px solid ${getTrendColor()}`,
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: gradient ? 'white' : getTrendColor()
                }
              }}
            />
          )}
        </Box>

        {/* Barra de progreso */}
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                background: gradient ? 'rgba(255,255,255,0.3)' : 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: gradient ? 'white' : `${color}.main`,
                  borderRadius: 3,
                }
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: gradient ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                mt: 0.5,
                display: 'block',
                textAlign: 'right'
              }}
            >
              {progress.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernKPICard;