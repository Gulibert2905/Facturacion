// src/components/filters/AdvancedFilters.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Save,
  Delete,
  FilterList,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  Star,
  StarBorder,
  Add,
  Edit
} from '@mui/icons-material';

/**
 * Componente de Filtros Avanzados reutilizable para cualquier sección
 * @param {Object} props Propiedades del componente
 * @returns {JSX.Element} Componente de filtros avanzados
 */
const AdvancedFilters = ({
  filterConfig = [],
  initialFilters = {},
  onFilterChange,
  onSaveFilter,
  onApplyFilter,
  onDeleteFilter,
  savedFilters = [],
  showSavedFilters = true,
  title = 'Filtros Avanzados'
}) => {
  // Estado para los filtros
  const [filters, setFilters] = useState(initialFilters);
  const [expanded, setExpanded] = useState(true);
  const [savedFilterDialogOpen, setSavedFilterDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Efecto para contar filtros activos
  useEffect(() => {
    // Contar filtros que no están vacíos, excluyendo filtros con valores por defecto
    const count = Object.entries(filters).reduce((acc, [key, value]) => {
      // Verificar si el filtro está activo
      const isActive = Array.isArray(value) 
        ? value.length > 0 && !value.includes('all')
        : value !== null && value !== undefined && value !== '' && value !== 'all';
      
      return isActive ? acc + 1 : acc;
    }, 0);
    
    setActiveFiltersCount(count);
  }, [filters]);

  // Manejar cambios en filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Llamar a la función de callback si se proporciona
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
      
      return newFilters;
    });
  };

  // Resetear todos los filtros
  const handleResetFilters = () => {
    // Crear un objeto con valores predeterminados según la configuración
    const defaultFilters = filterConfig.reduce((acc, filter) => {
      acc[filter.field] = filter.defaultValue !== undefined ? filter.defaultValue : null;
      return acc;
    }, {});
    
    setFilters(defaultFilters);
    
    if (onFilterChange) {
      onFilterChange(defaultFilters);
    }
  };

  // Aplicar filtros guardados
  const handleApplyFilter = (savedFilter) => {
    if (savedFilter && savedFilter.filters) {
      setFilters(savedFilter.filters);
      
      if (onFilterChange) {
        onFilterChange(savedFilter.filters);
      }
      
      if (onApplyFilter) {
        onApplyFilter(savedFilter);
      }
    }
  };

  // Guardar filtro actual
  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };
    
    setSavedFilterDialogOpen(false);
    setFilterName('');
    
    if (onSaveFilter) {
      onSaveFilter(newFilter);
    }
  };

  // Eliminar filtro guardado
  const handleDeleteFilter = (id) => {
    if (onDeleteFilter) {
      onDeleteFilter(id);
    }
  };

  // Renderizar controles según el tipo de filtro
  const renderFilterControl = (filter) => {
    const {
      type,
      field,
      label,
      options,
      placeholder,
      multiple,
      min,
      max,
      step,
      adornment,
      adornmentPosition = 'start'
    } = filter;
    
    const value = filters[field] !== undefined ? filters[field] : filter.defaultValue || null;
    
    switch (type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={label}
            value={value || ''}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            placeholder={placeholder || ''}
            variant="outlined"
            size="small"
            InputProps={adornment ? {
              [adornmentPosition === 'start' ? 'startAdornment' : 'endAdornment']: (
                <InputAdornment position={adornmentPosition}>
                  {adornment}
                </InputAdornment>
              )
            } : undefined}
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              value={multiple ? (value || []) : (value || '')}
              multiple={multiple}
              onChange={(e) => handleFilterChange(field, e.target.value)}
              label={label}
              displayEmpty={!multiple}
              renderValue={multiple ? (selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = options.find(opt => 
                      (opt.value || opt.id || opt) === value
                    );
                    return (
                      <Chip 
                        key={value} 
                        label={option ? (option.label || option.name || option) : value} 
                        size="small" 
                      />
                    );
                  })}
                </Box>
              ) : undefined}
            >
              {!multiple && (
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
              )}
              
              {options && options.map((option, index) => {
                const optionValue = option.value || option.id || option;
                const optionLabel = option.label || option.name || option;
                
                return (
                  <MenuItem key={index} value={optionValue}>
                    {optionLabel}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        );
        
      case 'date':
        return (
          <DatePicker
            label={label}
            value={value ? new Date(value) : null}
            onChange={(date) => handleFilterChange(field, date)}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        );
        
      case 'dateRange':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <DatePicker
                label={`${label} desde`}
                value={value && value.from ? new Date(value.from) : null}
                onChange={(date) => handleFilterChange(field, { ...value, from: date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label={`${label} hasta`}
                value={value && value.to ? new Date(value.to) : null}
                onChange={(date) => handleFilterChange(field, { ...value, to: date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </Grid>
        );
        
      case 'number':
        return (
          <TextField
            fullWidth
            label={label}
            value={value !== null && value !== undefined ? value : ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : Number(e.target.value);
              handleFilterChange(field, numValue);
            }}
            placeholder={placeholder || ''}
            type="number"
            variant="outlined"
            size="small"
            InputProps={{
              inputProps: { min, max, step },
              ...(adornment ? {
                [adornmentPosition === 'start' ? 'startAdornment' : 'endAdornment']: (
                  <InputAdornment position={adornmentPosition}>
                    {adornment}
                  </InputAdornment>
                )
              } : {})
            }}
          />
        );
        
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleFilterChange(field, e.target.checked)}
                color="primary"
              />
            }
            label={label}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Encabezado */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.lighter',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">
            {title}
          </Typography>
          {activeFiltersCount > 0 && (
            <Badge 
              badgeContent={activeFiltersCount} 
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Filtros guardados */}
          {showSavedFilters && savedFilters.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Filtros Guardados
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {savedFilters.map((filter) => (
                  <Chip
                    key={filter.id}
                    label={filter.name}
                    onClick={() => handleApplyFilter(filter)}
                    onDelete={() => handleDeleteFilter(filter.id)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {/* Controles de filtros */}
          <Grid container spacing={2}>
            {filterConfig.map((filter, index) => (
              <Grid item xs={12} sm={6} md={filter.width || 4} key={index}>
                {renderFilterControl(filter)}
              </Grid>
            ))}
          </Grid>

          {/* Botones de acción */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleResetFilters}
            >
              Limpiar
            </Button>
            
            <Button
              size="small"
              startIcon={<Save />}
              onClick={() => setSavedFilterDialogOpen(true)}
              disabled={activeFiltersCount === 0}
            >
              Guardar
            </Button>
            
            <Button
              size="small"
              variant="contained"
              startIcon={<Search />}
              onClick={() => onFilterChange && onFilterChange(filters)}
              disabled={activeFiltersCount === 0}
            >
              Aplicar Filtros
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Diálogo para guardar filtro */}
      <Dialog open={savedFilterDialogOpen} onClose={() => setSavedFilterDialogOpen(false)}>
        <DialogTitle>Guardar Filtro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del filtro"
            fullWidth
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSavedFilterDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveFilter} 
            disabled={!filterName.trim()}
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdvancedFilters;