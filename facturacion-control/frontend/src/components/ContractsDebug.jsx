// src/components/ContractsDebug.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

/**
 * Componente para depurar la carga de contratos
 * Añade este componente temporalmente a Reports.jsx para diagnosticar el problema
 */
const ContractsDebug = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [contracts, setContracts] = useState([]);
  const [result, setResult] = useState({});

  // Función para cargar empresas
  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar fetch directamente para evitar problemas con useApi
      const response = await fetch('http://localhost:5000/api/companies', {
        headers: {
          'Content-Type': 'application/json'
        },
        // Importante: usar same-origin para evitar problemas de CORS
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Empresas cargadas:', data);
      setCompanies(data || []);
      setResult({ ...result, companies: data });
    } catch (err) {
      console.error('Error cargando empresas:', err);
      setError(`Error cargando empresas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar contratos
  const loadContracts = async () => {
    if (!selectedCompany) {
      setError('Selecciona una empresa primero');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar fetch directamente para evitar problemas con useApi
      const url = `http://localhost:5000/api/companies/${selectedCompany}/contracts`;
      console.log('Cargando contratos desde:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Importante: usar same-origin para evitar problemas de CORS
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Contratos cargados:', data);
      setContracts(data || []);
      setResult({ ...result, contracts: data });
    } catch (err) {
      console.error('Error cargando contratos:', err);
      setError(`Error cargando contratos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar todos los contratos
  const loadAllContracts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar todos los contratos
      const url = `http://localhost:5000/api/contracts`;
      console.log('Cargando todos los contratos desde:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Todos los contratos cargados:', data);
      setContracts(data || []);
      setResult({ ...result, allContracts: data });
    } catch (err) {
      console.error('Error cargando todos los contratos:', err);
      setError(`Error cargando todos los contratos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Depuración de Contratos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={loadCompanies}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Cargar Empresas'}
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Empresas cargadas: {companies.length}
        </Typography>
      </Box>

      {companies.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Seleccionar Empresa</InputLabel>
            <Select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              label="Seleccionar Empresa"
            >
              {companies.map((company) => (
                <MenuItem key={company._id} value={company._id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            onClick={loadContracts}
            disabled={loading || !selectedCompany}
            color="primary"
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Cargar Contratos por Empresa'}
          </Button>

          <Button 
            variant="outlined" 
            onClick={loadAllContracts}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Cargar Todos los Contratos'}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Contratos cargados: {contracts.length}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Respuesta Raw:
        </Typography>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            maxHeight: '200px', 
            overflow: 'auto',
            bgcolor: '#f5f5f5' 
          }}
        >
          <pre style={{ margin: 0, fontSize: '0.8rem' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Paper>
      </Box>
    </Paper>
  );
};

export default ContractsDebug;