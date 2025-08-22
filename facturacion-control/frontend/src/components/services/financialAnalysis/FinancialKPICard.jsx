// src/components/financialAnalysis/FinancialKPICard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';

/**
 * Componente que muestra un KPI financiero en forma de tarjeta
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título del KPI
 * @param {number|null} props.value - Valor del KPI
 * @param {boolean} props.loading - Indicador de carga
 * @param {string} props.format - Formato del valor (currency, percentage, days, number)
 * @param {React.ReactNode} props.icon - Ícono a mostrar
 * @param {string} props.color - Color de la tarjeta (primary, secondary, success, error, etc.)
 * @param {number} props.trend - Valor de tendencia (porcentaje de cambio)
 * @param {boolean} props.invertTrend - Si es true, un valor negativo de tendencia se muestra como positivo
 * @param {React.ReactNode} props.footer - Contenido adicional para el pie de la tarjeta
 */
const FinancialKPICard = ({
  title,
  value,
  loading = false,
  format = 'number',
  icon,
  color = 'primary',
  trend,
  invertTrend = false,
  footer
}) => {
  // Formatear valor según el tipo de KPI
  const formatValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      
      case 'percentage':
        return new Intl.NumberFormat('es-CO', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 2
        }).format(val / 100);
      
      case 'days':
        return `${Math.round(val)} días`;
      
      default:
        return new Intl.NumberFormat('es-CO').format(val);
    }
  };
  
  // Determinar color y ícono de tendencia
  const getTrendInfo = () => {
    if (trend === undefined || trend === null) return {};
    
    // Si invertTrend es true, invertimos la lógica (ej: para tasa de glosas, negativo es bueno)
    const normalizedTrend = invertTrend ? -trend : trend;
    
    let trendColor = 'text.secondary';
    let TrendIcon = TrendingFlatIcon;
    
    if (normalizedTrend > 1) {
      trendColor = 'success.main';
      TrendIcon = TrendingUpIcon;
    } else if (normalizedTrend < -1) {
      trendColor = 'error.main';
      TrendIcon = TrendingDownIcon;
    }
    
    return { trendColor, TrendIcon };
  };
  
  const { trendColor, TrendIcon } = getTrendInfo();
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%',
        borderColor: loading ? 'divider' : `${color}.main`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && (
            <Box
              sx={{
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                color: `${color}.main`
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>

        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={40} />
        ) : (
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ fontWeight: 'bold', mb: 1, color: `${color}.main` }}
          >
            {formatValue(value)}
          </Typography>
        )}
        
        {trend !== undefined && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ color: trendColor, display: 'flex', alignItems: 'center' }}>
              <TrendIcon fontSize="small" />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              vs período anterior
            </Typography>
          </Box>
        )}
        
        {footer && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {footer}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialKPICard;