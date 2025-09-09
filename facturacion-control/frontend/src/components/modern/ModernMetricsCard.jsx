import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Remove as TrendNeutralIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme, variant }) => {
  const colors = {
    primary: {
      bg: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.light}10)`,
      border: theme.palette.primary.main,
      accent: theme.palette.primary.main
    },
    success: {
      bg: `linear-gradient(135deg, ${theme.palette.success.main}20, ${theme.palette.success.light}10)`,
      border: theme.palette.success.main,
      accent: theme.palette.success.main
    },
    warning: {
      bg: `linear-gradient(135deg, ${theme.palette.warning.main}20, ${theme.palette.warning.light}10)`,
      border: theme.palette.warning.main,
      accent: theme.palette.warning.main
    },
    info: {
      bg: `linear-gradient(135deg, ${theme.palette.info.main}20, ${theme.palette.info.light}10)`,
      border: theme.palette.info.main,
      accent: theme.palette.info.main
    }
  };

  const colorScheme = colors[variant] || colors.primary;

  return {
    background: colorScheme.bg,
    border: `1px solid ${colorScheme.border}40`,
    borderRadius: theme.spacing(2),
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      '& .metric-value': {
        transform: 'scale(1.05)'
      }
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: `linear-gradient(90deg, ${colorScheme.accent}, ${colorScheme.accent}80)`,
      borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`
    }
  };
});

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2.5rem',
  lineHeight: 1,
  transition: 'transform 0.2s ease',
  background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
}));

const TrendIndicator = styled(Box)(({ theme, trend }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return theme.palette.success.main;
      case 'down': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(1),
    backgroundColor: `${getTrendColor()}20`,
    color: getTrendColor(),
    fontSize: '0.875rem',
    fontWeight: 600,
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
      marginRight: theme.spacing(0.5)
    }
  };
});

const ModernMetricsCard = ({
  title,
  value,
  subtitle,
  variant = 'primary',
  trend,
  trendValue,
  progress,
  progressLabel,
  icon: Icon,
  onClick,
  tooltip,
  formatter = (val) => val
}) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return TrendUpIcon;
      case 'down': return TrendDownIcon;
      default: return TrendNeutralIcon;
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <StyledCard 
      variant={variant} 
      elevation={2}
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" mb={1}>
              {Icon && (
                <Icon 
                  sx={{ 
                    mr: 1, 
                    color: `${variant}.main`,
                    fontSize: '1.5rem'
                  }} 
                />
              )}
              <Typography 
                variant="subtitle2" 
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {title}
              </Typography>
            </Box>

            <MetricValue className="metric-value" variant="h3">
              {formatter(value)}
            </MetricValue>

            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Stack spacing={1} alignItems="flex-end">
            {tooltip && (
              <Tooltip title={tooltip}>
                <IconButton size="small" sx={{ opacity: 0.7 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {trend && (
              <TrendIndicator trend={trend}>
                <TrendIcon />
                {trendValue}
              </TrendIndicator>
            )}
          </Stack>
        </Box>

        {/* Barra de progreso */}
        {progress !== undefined && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              {progressLabel && (
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {progressLabel}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: `${variant}.light`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${theme.palette[variant].main}, ${theme.palette[variant].dark})`
                }
              }}
            />
          </Box>
        )}

        {/* Etiquetas adicionales */}
        {trend && trendValue && (
          <Box mt={2}>
            <Chip
              label={`${trend === 'up' ? '+' : trend === 'down' ? '-' : ''}${trendValue} vs. período anterior`}
              size="small"
              variant="outlined"
              color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'}
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            />
          </Box>
        )}

        {/* Decoración de fondo */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `${theme.palette[variant].main}08`,
            zIndex: 0
          }}
        />
      </CardContent>
    </StyledCard>
  );
};

export default ModernMetricsCard;