import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  CalendarToday,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Today,
  DateRange,
  Schedule
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

const ModernFilters = ({
  companies = [],
  onFiltersChange,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: null,
    endDate: null,
    companies: [],
    status: 'all',
    ...initialFilters
  });
  
  const [expanded, setExpanded] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'Hoy', icon: <Today /> },
    { value: 'week', label: 'Semana', icon: <Schedule /> },
    { value: 'month', label: 'Mes', icon: <CalendarToday /> },
    { value: 'quarter', label: 'Trimestre', icon: <DateRange /> },
    { value: 'year', label: 'Año', icon: <DateRange /> },
    { value: 'custom', label: 'Personalizado', icon: <DateRange /> }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      period: 'month',
      startDate: null,
      endDate: null,
      companies: [],
      status: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.companies.length > 0) count++;
    if (filters.status !== 'all') count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6" fontWeight={600}>
              Filtros de Análisis
            </Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={getActiveFiltersCount()}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
              startIcon={<Clear />}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Limpiar
            </Button>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'white' }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Filtros básicos - siempre visibles */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Selector de período */}
          <ToggleButtonGroup
            value={filters.period}
            exclusive
            onChange={(e, value) => value && handleFilterChange('period', value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.8)',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }
            }}
          >
            {periodOptions.slice(0, 4).map(option => (
              <ToggleButton key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {React.cloneElement(option.icon, { sx: { fontSize: 16 } })}
                  {option.label}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Filtros avanzados - colapsables */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Fechas personalizadas */}
            {filters.period === 'custom' && (
              <>
                <DatePicker
                  label="Fecha inicio"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.5)'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'white'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255,255,255,0.8)'
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white'
                        }
                      }
                    }
                  }}
                />
                <DatePicker
                  label="Fecha fin"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.5)'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'white'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255,255,255,0.8)'
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white'
                        }
                      }
                    }
                  }}
                />
              </>
            )}

            {/* Selector de empresas */}
            <Autocomplete
              multiple
              options={companies}
              getOptionLabel={(option) => option.name}
              value={companies.filter(company => filters.companies.includes(company._id))}
              onChange={(event, newValue) => {
                handleFilterChange('companies', newValue.map(company => company._id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Empresas"
                  size="small"
                  sx={{
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'white'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.8)'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white'
                    }
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option._id}
                    label={option.name}
                    {...getTagProps({ index })}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255,255,255,0.8)'
                      }
                    }}
                  />
                ))
              }
            />

            {/* Selector de estado */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Estado</InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => handleFilterChange('status', e.target.value)}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '& .MuiSelect-icon': {
                    color: 'white'
                  }
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  );
};

export default ModernFilters;