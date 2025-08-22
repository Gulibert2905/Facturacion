// src/components/PaginatedTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  FormControl,
  
  Select,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Button,
  Tooltip
} from '@mui/material';
import {
  Search,
  
  Refresh,
  Download,
  FilterAlt,
  FilterAltOff
} from '@mui/icons-material';

/**
 * Componente de tabla optimizado con paginación, ordenamiento y filtrado
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.columns - Definición de las columnas
 * @param {Array} props.data - Datos a mostrar (si se pasa null, se usa paginación del servidor)
 * @param {Function} props.fetchData - Función para obtener datos del servidor
 * @param {Function} props.onRowClick - Función a ejecutar al hacer clic en una fila
 * @param {Boolean} props.loading - Indica si está cargando datos
 * @param {Object} props.pagination - Información de paginación (page, pageSize, total)
 * @param {Object} props.defaultSort - Ordenamiento por defecto (field, direction)
 * @param {Boolean} props.serverSide - Indica si la paginación se hace en el servidor
 * @param {Function} props.onDownload - Función para descargar datos
 */
const PaginatedTable = ({
  columns = [],
  data = [],
  fetchData = null,
  onRowClick = null,
  loading = false,
  pagination: paginationProp = { page: 0, pageSize: 10, total: 0 },
  defaultSort = { field: '', direction: 'asc' },
  serverSide = false,
  onDownload = null,
  showFilters = true
}) => {
  // Estado para paginación
  const [pagination, setPagination] = useState({
    page: paginationProp.page,
    pageSize: paginationProp.pageSize,
    total: paginationProp.total
  });

  // Estado para ordenamiento
  const [sortConfig, setSortConfig] = useState(defaultSort);

  // Estado para filtros
  const [filters, setFilters] = useState({});
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Manejar cambios en props de paginación
  useEffect(() => {
    setPagination({
      page: paginationProp.page,
      pageSize: paginationProp.pageSize,
      total: paginationProp.total
    });
  }, [paginationProp]);

  // Función para aplicar el ordenamiento a los datos (sólo en el cliente)
  const getSortedData = () => {
    if (!sortConfig.field || !data || serverSide) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Determinar el tipo de datos para ordenamiento
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Ordenamiento de fechas
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Ordenamiento de texto
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };

  // Obtener valor de una propiedad anidada (por ejemplo 'user.name')
  const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  };

  // Aplicar filtros (cliente)
  const getFilteredData = () => {
    if (serverSide || !filters || Object.keys(filters).length === 0) return getSortedData();

    return getSortedData().filter(row => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue) return true;
        
        const value = getNestedValue(row, field);
        
        // Si no hay valor, no pasa el filtro
        if (value === null || value === undefined) return false;
        
        // Filtrar dependiendo del tipo de dato
        if (typeof value === 'number') {
          return value.toString().includes(filterValue);
        }
        
        if (value instanceof Date) {
          return value.toISOString().includes(filterValue);
        }
        
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  };

  // Datos a mostrar (con ordenamiento y filtros aplicados)
  const displayData = serverSide ? data : getFilteredData();

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
    
    if (serverSide && fetchData) {
      fetchData({
        page: newPage,
        pageSize: pagination.pageSize,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        filters
      });
    }
  };

  // Manejar cambio de tamaño de página
  const handleChangeRowsPerPage = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination({
      ...pagination,
      page: 0,
      pageSize: newPageSize
    });
    
    if (serverSide && fetchData) {
      fetchData({
        page: 0,
        pageSize: newPageSize,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        filters
      });
    }
  };

  // Manejar cambio de ordenamiento
  const handleSort = (field) => {
    let direction = 'asc';
    
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ field, direction });
    
    if (serverSide && fetchData) {
      fetchData({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortField: field,
        sortDirection: direction,
        filters
      });
    }
  };

  // Manejar cambio de filtro
  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    
    // Si el valor está vacío, eliminar el filtro
    if (!value) {
      delete newFilters[field];
    }
    
    setFilters(newFilters);
    
    // Contar filtros activos
    setActiveFilters(Object.values(newFilters).filter(Boolean).length);
    
    // Si se usa paginación en servidor, resetear a primera página
    if (serverSide && fetchData) {
      setPagination({ ...pagination, page: 0 });
      fetchData({
        page: 0,
        pageSize: pagination.pageSize,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        filters: newFilters
      });
    }
  };

  // Manejar limpieza de filtros
  const handleClearFilters = () => {
    setFilters({});
    setActiveFilters(0);
    
    if (serverSide && fetchData) {
      fetchData({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        filters: {}
      });
    }
  };

  // Calcular total de filas según servidor o cliente
  const totalRows = serverSide ? pagination.total : displayData.length;
  
  // Datos que se muestran actualmente (solo para paginación en cliente)
  const currentPageData = serverSide 
    ? displayData 
    : displayData.slice(
        pagination.page * pagination.pageSize,
        pagination.page * pagination.pageSize + pagination.pageSize
      );

  return (
    <Paper elevation={2}>
      {/* Barra de herramientas */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {loading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : (
              `${totalRows} registros`
            )}
          </Typography>
          {activeFilters > 0 && (
            <Chip 
              label={`${activeFilters} filtros activos`} 
              color="primary" 
              size="small" 
              onDelete={handleClearFilters}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showFilters && (
            <Tooltip title={showFilterRow ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton 
                color={showFilterRow ? "primary" : "default"}
                onClick={() => setShowFilterRow(!showFilterRow)}
              >
                {showFilterRow ? <FilterAltOff /> : <FilterAlt />}
              </IconButton>
            </Tooltip>
          )}
          
          {fetchData && (
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={() => fetchData({
                  page: pagination.page,
                  pageSize: pagination.pageSize,
                  sortField: sortConfig.field,
                  sortDirection: sortConfig.direction,
                  filters
                })}
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          
          {onDownload && (
            <Tooltip title="Descargar datos">
              <IconButton onClick={onDownload} disabled={loading}>
                <Download />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Tabla */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            {/* Encabezados */}
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ 
                    minWidth: column.minWidth,
                    width: column.width 
                  }}
                  sortDirection={sortConfig.field === column.field ? sortConfig.direction : false}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={sortConfig.field === column.field}
                      direction={sortConfig.field === column.field ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.headerName || column.field}
                    </TableSortLabel>
                  ) : (
                    column.headerName || column.field
                  )}
                </TableCell>
              ))}
            </TableRow>
            
            {/* Fila de filtros */}
            {showFilterRow && (
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={`filter-${column.field}`}>
                    {column.filterable !== false && (
                      column.filterType === 'select' ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={filters[column.field] || ''}
                            onChange={(e) => handleFilterChange(column.field, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">Todos</MenuItem>
                            {column.filterOptions?.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          size="small"
                          placeholder={`Buscar ${column.headerName || column.field}`}
                          value={filters[column.field] || ''}
                          onChange={(e) => handleFilterChange(column.field, e.target.value)}
                          fullWidth
                          InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          }}
                        />
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>
          
          <TableBody>
            {loading && currentPageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Cargando datos...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : currentPageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    No se encontraron registros
                  </Typography>
                  {activeFilters > 0 && (
                    <Button 
                      variant="text"
                      startIcon={<FilterAltOff />}
                      onClick={handleClearFilters}
                      sx={{ mt: 1 }}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              currentPageData.map((row, index) => (
                <TableRow
                  hover
                  tabIndex={-1}
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => {
                    const value = getNestedValue(row, column.field);
                    return (
                      <TableCell key={column.field} align={column.align || 'left'}>
                        {column.renderCell ? column.renderCell(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Paginación */}
      <TablePagination
        component="div"
        count={totalRows}
        rowsPerPage={pagination.pageSize}
        page={pagination.page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Paper>
  );
};

// Ejemplo de uso:
// <PaginatedTable
//   columns={[
//     { field: 'id', headerName: 'ID', width: 90 },
//     { field: 'name', headerName: 'Nombre', minWidth: 150 },
//     { field: 'age', headerName: 'Edad', width: 100, align: 'right' },
//     { 
//       field: 'status', 
//       headerName: 'Estado', 
//       width: 120,
//       renderCell: (value) => <Chip label={value} color={value === 'Activo' ? 'success' : 'error'} />
//     }
//   ]}
//   data={data}
//   onRowClick={(row) => console.log('Row clicked:', row)}
//   serverSide={false}
// />

export default PaginatedTable;