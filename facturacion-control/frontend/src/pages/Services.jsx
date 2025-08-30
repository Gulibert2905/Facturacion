import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../utils/dateUtils';
import { formatServiceDate } from '../utils/dateFormatter';
import {
 Box,
 Paper,
 Grid,
 TextField,
 Button,
 Table,
 CircularProgress,
 TableBody,
 TableCell,
 TableContainer,
 TableHead,
 TableRow,
 Alert,
 Snackbar,
 FormControl,
 Typography,
 InputLabel,
 Select,
 MenuItem
} from '@mui/material';
import ActivePreBills from '../components/ActivePreBills';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

function Services() {
const [patient, setPatient] = useState(null);
const [documentNumber, setDocumentNumber] = useState('');
const [services, setServices] = useState([]);
const [selectedServices, setSelectedServices] = useState([]);
const [showAlert, setShowAlert] = useState(false);
const [alertMessage, setAlertMessage] = useState('');
const [contracts, setContracts] = useState([]);
const [selectedContract, setSelectedContract] = useState('');
const [authorization, setAuthorization] = useState('');
const [diagnosis, setDiagnosis] = useState('');
const [selectedCompany, setSelectedCompany] = useState('');
const [companies, setCompanies] = useState([]);
const [showServiceSelection, setShowServiceSelection] = useState(false);
const [showActivePreBills, setShowActivePreBills] = useState(false);
const [hasActivePreBills, setHasActivePreBills] = useState(false);

const [prefacturationSession, setPrefacturationSession] = useState({
  active: false,
  company: null,
  contract: null,
  preBillId: null  
});
const [savedPreBills, setSavedPreBills] = useState([]);
const [isLoading, setIsLoading] = useState(false);


useEffect(() => {
  if (services.length > 0) {
    console.log('Estructura de un servicio:', {
      serviceDate: {
        value: services[0].serviceDate,
        type: typeof services[0].serviceDate,
        isDate: services[0].serviceDate instanceof Date
      }
    });
  }
}, [services]);

 // Cargar empresas al inicio
useEffect(() => {
  loadCompanies();
}, []);

// Cargar contratos cuando cambia la empresa
useEffect(() => {
  if (selectedCompany) {
    loadContracts(selectedCompany);
  } else {
    setContracts([]);
  }
}, [selectedCompany]);

// Verificar prefacturas activas
const checkActivePreBills = useCallback(async () => {
  if (!selectedCompany || !selectedContract) return;
  
  try {
    const url = `http://localhost:5000/api/prebills/active?companyId=${selectedCompany}&contractId=${selectedContract}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      setHasActivePreBills(data.length > 0);
    }
  } catch (error) {
    console.error('Error al verificar prefacturas activas:', error);
  }
}, [selectedCompany, selectedContract]);

// Limpiar datos de prefacturación
const clearPrefacturationData = useCallback(() => {
  setSelectedServices([]);
  setAuthorization('');
  setDiagnosis('');
  
  // Solo resetear la sesión si no hay prefacturas activas
    setPrefacturationSession(prev => ({
      ...prev,
      active: false,
      //company: selectedCompany,
      //contract: selectedContract,
      preBillId: null
    }));
  }, []);
  

 // 3. EFECTOS PARA GESTIONAR CAMBIOS DE EMPRESA/CONTRATO

// Cuando cambia la empresa, limpiar contrato y datos
useEffect(() => {
  setSelectedContract('');
  clearPrefacturationData();
}, [selectedCompany, clearPrefacturationData]);

// Cuando cambia el contrato, verificar prefacturas y limpiar datos
useEffect(() => {
  if (selectedContract) {
    clearPrefacturationData();
    checkActivePreBills();
  }
}, [selectedContract, clearPrefacturationData, checkActivePreBills]);

 // 4. FUNCIONES PARA CARGAR DATOS
const loadCompanies = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/companies');
    const data = await response.json();
    setCompanies(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error:', error);
    setCompanies([]);
  }
};

const loadContracts = async (companyId) => {
  try {
    console.log("Cargando contratos para empresa:", companyId);
    const response = await fetch(`http://localhost:5000/api/companies/${companyId}/contracts`);
    const data = await response.json();
    console.log("Contratos obtenidos:", data);
    setContracts(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error cargando contratos:', error);
    setContracts([]);
  }
};

const loadPatientServices = async (docNumber) => {
  try {
    // Validar y limpiar el número de documento
    const cleanDocNumber = docNumber ? String(docNumber).trim() : '';
    
    if (!cleanDocNumber || cleanDocNumber === '') {
      console.error('Número de documento vacío');
      setAlertMessage('Número de documento requerido');
      setShowAlert(true);
      return;
    }

    console.log('Cargando servicios para documento:', cleanDocNumber);
    
    const response = await fetch(`http://localhost:5000/api/services/patients/${encodeURIComponent(cleanDocNumber)}/services`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Datos recibidos:', data);
    
    if (response.ok) {
      if (data.patient) {
        setPatient(data.patient);
      }
      
      if (data.services) {
        const processedServices = processServiceData(data.services);
        setServices(processedServices);
      }
    } else {
      setServices([]);
      if (response.status === 401) {
        setAlertMessage('Sesión expirada. Por favor inicie sesión nuevamente.');
      } else {
        setAlertMessage(data.message || 'Error al cargar servicios');
      }
      setShowAlert(true);
    }
  } catch (error) {
    console.error('Error:', error);
    setServices([]);
    setAlertMessage('Error al cargar servicios');
    setShowAlert(true);
  }
};


// 5. FUNCIONES DE MANEJO DE EVENTOS
const handleCompanyChange = (value) => {
setSelectedCompany(value || '');
if (value) {
  loadContracts(value);
} else {
  setContracts([]);
}
setSelectedContract('');
};

const handleStartPreBilling = () => {
  if (selectedCompany && selectedContract) {
    setShowServiceSelection(true);  // Este ya lo tienes
    // Agregar esto:
    setPrefacturationSession({
      active: true,
      company: selectedCompany,
      contract: selectedContract
    });
  } else {
    setAlertMessage('Seleccione empresa y contrato primero');
    setShowAlert(true);
  }
};

const handleSearchPatient = async (docNumber = documentNumber) => {
  try {
    // Validar y limpiar el número de documento
    const cleanDocNumber = docNumber ? String(docNumber).trim() : '';
    
    if (!cleanDocNumber || cleanDocNumber === '') {
      setAlertMessage('Ingrese un número de documento válido');
      setShowAlert(true);
      return;
    }

    console.log('Buscando paciente con documento:', cleanDocNumber);
    
    const response = await fetch(`http://localhost:5000/api/patients/${encodeURIComponent(cleanDocNumber)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Paciente encontrado:', data);
      setPatient(data.patient || data); // Manejar diferentes estructuras de respuesta
      await loadPatientServices(cleanDocNumber);
    } else {
      console.error('Error buscando paciente:', data);
      if (response.status === 404) {
        setAlertMessage(`No se encontró un paciente con documento: ${cleanDocNumber}`);
      } else if (response.status === 401) {
        setAlertMessage('Sesión expirada. Por favor inicie sesión nuevamente.');
      } else {
        setAlertMessage(data.message || 'Error al buscar paciente');
      }
      setShowAlert(true);
      setPatient(null);
    }
  } catch (error) {
    console.error('Error:', error);
    setAlertMessage('Error al buscar paciente');
    setShowAlert(true);
  }
};

const handleCloseAlert = () => setShowAlert(false);

// 6. FUNCIONES DE PREFACTURACIÓN
 // Función para exportar prefacturas
const handleExportPreBills = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/prebills/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prefacturacion_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Limpiar estados
      setShowServiceSelection(false);
      setSelectedCompany(null);
      setSelectedContract('');
      setAlertMessage('Prefacturación exportada exitosamente');
      setShowAlert(true);
    }
  } catch (error) {
    console.error('Error:', error);
    setAlertMessage('Error al exportar prefacturación');
    setShowAlert(true);
  }
};

const checkDuplicate = (service) => {
  return selectedServices.some(s => 
    s.cupsCode === service.cupsCode && 
    s.serviceDate === service.serviceDate
  );
};

const addToPreBill = async (service) => {
  if (service.isPrefactured) {
    setAlertMessage(`Este servicio ya fue prefacturado el ${service.prefacturedAt || ''}`);
    setShowAlert(true);
    return;
  }

  if (checkDuplicate(service)) {
    setAlertMessage('Este servicio ya está agregado para esta fecha');
    setShowAlert(true);
    return;
  }

  try {
    // Buscar el valor del servicio en el contrato seleccionado
    const response = await fetch(`http://localhost:5000/api/cups/${service.cupsCode}/tariff/${selectedContract}`);
    
    let tariffData = null;
    
    if (response.ok) {
      tariffData = await response.json();
      console.log('Tarifa encontrada:', tariffData);
    } else {
      // Si no existe tarifa específica, mostrar advertencia
      setAlertMessage(`Este servicio no tiene tarifa asignada en el contrato seleccionado. Se usará el valor por defecto.`);
      setShowAlert(true);
    }
    
    // Crear el objeto de servicio actualizado con los datos del contrato
    const updatedService = {
      ...service,
      contractId: selectedContract,
      company: selectedCompany,
      serviceDate: typeof service.serviceDate === 'string' 
        ? service.serviceDate 
        : formatServiceDate(service.serviceDate),
      prefacturedAt: service.prefacturedAt 
        ? (typeof service.prefacturedAt === 'string' 
            ? service.prefacturedAt 
            : formatServiceDate(service.prefacturedAt)) 
        : null,
      value: tariffData ? tariffData.value : service.value || 0,
      requiresAuthorization: tariffData ? tariffData.requiresAuthorization : false
    };
    
    // Agregar a los servicios seleccionados
    setSelectedServices(prev => [...prev, updatedService]);
    
    // Actualizar el servicio en la base de datos (opcional)
    try {
      await fetch(`http://localhost:5000/api/services/${service._id}/assign-contract`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractId: selectedContract, 
          company: selectedCompany,
          value: updatedService.value
        })
      });
    } catch (updateError) {
      console.error('Error actualizando servicio:', updateError);
      // No mostramos error al usuario ya que el servicio se agregó correctamente a la lista
    }
  } catch (error) {
    console.error('Error:', error);
    setAlertMessage('Error al procesar el servicio');
    setShowAlert(true);
  }
};

const handleSavePreBill = async () => {
  try {
    const preBillData = {
      companyId: selectedCompany,
      contractId: selectedContract,
      patientId: patient._id,
      services: selectedServices.map(service => ({
        serviceId: service._id,
        cupsCode: service.cupsCode,
        value: service.value,
        serviceDate: service.serviceDate
      })),
      authorization,
      diagnosis,
      preBillId: prefacturationSession.preBillId,
      totalValue: selectedServices.reduce((sum, service) => sum + service.value, 0)
    };

    const response = await fetch('http://localhost:5000/api/prebills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preBillData)
    });

    if (response.ok) {
      const savedPreBill = await response.json();

      // Actualizar la sesión de prefacturación con el ID
      setPrefacturationSession(prev => ({
        ...prev,
        preBillId: savedPreBill._id
      }));

      setSavedPreBills(prev => [...prev, savedPreBill]);
      setAlertMessage('Prefactura guardada exitosamente - Puede continuar con otro paciente');
      setShowAlert(true);
      // Limpiar solo los datos del paciente actual
      //setSelectedServices([]);
      setAuthorization('');
      setDiagnosis('');
      //setPatient(null);
      //setDocumentNumber('');
      //setServices([]);

      if (patient) {
        loadPatientServices(patient._id);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    setAlertMessage('Error al guardar la prefactura');
    setShowAlert(true);
  }
};

const handleFinishPrefacturation = async () => {
  try {
    console.log("Intentando finalizar prefactura correctamente...");
    
    if (!prefacturationSession.preBillId) {
      setAlertMessage('No hay prefactura activa');
      setShowAlert(true);
      return;
    }
    
    // Add loading state
    setIsLoading(true);
    
    // 1. Use a more robust fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    const finalizeUrl = `http://localhost:5000/api/prebills/${prefacturationSession.preBillId}/finalize`;
    console.log(`Sending finalize request to: ${finalizeUrl}`);
    
    const finalizeResponse = await fetch(finalizeUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!finalizeResponse.ok) {
      const errorText = await finalizeResponse.text();
      console.error(`Finalization response error (${finalizeResponse.status}): ${errorText}`);
      throw new Error(`Error al finalizar la prefactura (${finalizeResponse.status}): ${errorText}`);
    }
    
    // 2. Log successful response
    const finalizeData = await finalizeResponse.json();
    console.log("Finalization successful:", finalizeData);
    
    // 3. Download the Excel file
    const prefacturaUrl = `http://localhost:5000/api/prebills/reprint/${prefacturationSession.preBillId}`;
    console.log(`Opening export URL: ${prefacturaUrl}`);
    
    // Use a small delay to ensure the server has time to process
    await new Promise(resolve => setTimeout(resolve, 500));
    window.open(prefacturaUrl, '_blank');
    
    // 4. Reset states
    setPrefacturationSession({ active: false, company: null, contract: null, preBillId: null });
    setSelectedServices([]);
    setPatient(null);
    setDocumentNumber('');
    setServices([]);
    setShowServiceSelection(false);
    setHasActivePreBills(false);
    
    setAlertMessage('Prefactura finalizada y descargada correctamente');
    setShowAlert(true);
  } catch (error) {
    console.error("Error during finalization:", error);
    
    // Provide more specific error message based on error type
    if (error.name === 'AbortError') {
      setAlertMessage('La operación excedió el tiempo de espera. Intente nuevamente.');
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      setAlertMessage('Error de conexión. Verifique su conexión de red e intente nuevamente.');
    } else {
      setAlertMessage(`Error: ${error.message}`);
    }
    
    setShowAlert(true);
  } finally {
    setIsLoading(false);
  }
};

// Función auxiliar para exportar una sola prefactura
const exportSinglePreBill = async (preBill) => {
  return await fetch('http://localhost:5000/api/prebills/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preBills: [preBill._id],
      company: selectedCompany,
      contract: selectedContract
    })
  });
};

// Función auxiliar para manejar la respuesta de exportación
const handleExportResponse = async (response) => {
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prefacturas_${formatDate(new Date())}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    // Resetear estados
    setPrefacturationSession({ active: false, company: null, contract: null, preBillId: null });
    setSavedPreBills([]);
    setShowServiceSelection(false);
    setSelectedCompany(null);
    setSelectedContract('');
    setSelectedServices([]);
    
    setAlertMessage('Prefactura finalizada y exportada correctamente');
    setShowAlert(true);
  } else {
    const errorText = await response.text();
    console.error("Error en respuesta de exportación:", errorText);
    throw new Error('Error al exportar: ' + errorText);
  }
};

// Función para continuar con prefactura existente
const handleContinuePreBill = async (preBill) => {
  try {
    const response = await fetch(`http://localhost:5000/api/prebills/${preBill._id}`);
    
    if (response.ok) {
      const fullPreBill = await response.json();
      
      setSelectedCompany(fullPreBill.companyId._id);
      setSelectedContract(fullPreBill.contractId._id);

      // Cargar el paciente PRIMERO
      if (fullPreBill.patientId && fullPreBill.patientId.documentNumber) {
        setDocumentNumber(fullPreBill.patientId.documentNumber);
        setPatient(fullPreBill.patientId);
        
        // Cargar servicios directamente con el documento
        await loadPatientServices(fullPreBill.patientId.documentNumber);
        
        // DESPUÉS cargar los servicios seleccionados
        if (fullPreBill.services && fullPreBill.services.length > 0) {
          const servicesToLoad = fullPreBill.services.map(service => ({
            _id: service.serviceId,
            cupsCode: service.cupsCode,
            value: service.value,
            serviceDate: service.serviceDate,
            prefacturedAt: fullPreBill.createdAt,
            description: service.description || ''
          }));
          
          setSelectedServices(servicesToLoad);
        }
        
        // Configurar sesión
        setPrefacturationSession({
          active: true,
          company: fullPreBill.companyId._id,
          contract: fullPreBill.contractId._id,
          preBillId: fullPreBill._id
        });
        
        if (fullPreBill.authorization) setAuthorization(fullPreBill.authorization);
        if (fullPreBill.diagnosis) setDiagnosis(fullPreBill.diagnosis);

        setShowServiceSelection(true);
        setShowActivePreBills(false);
        setAlertMessage('Prefacturación cargada correctamente');
        setShowAlert(true);
      } else {
        setAlertMessage('Error: No se encontró información del paciente');
        setShowAlert(true);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    setAlertMessage('Error al cargar la prefacturación');
    setShowAlert(true);
  }
};

const processServiceData = (rawServices) => {
  return rawServices.map(service => {
    // Crear un nuevo objeto con fechas formateadas
    const processedService = {
      ...service,
      // Convertir todas las fechas a strings formateados
      serviceDate: formatServiceDate(service.serviceDate),
      birthDate: formatServiceDate(service.birthDate),
      prefacturedAt: service.prefacturedAt ? formatServiceDate(service.prefacturedAt) : null
    };
    
    // Log para debugging
    console.log('Processed service:', {
      originalDate: service.serviceDate,
      processedDate: processedService.serviceDate
    });
    
    return processedService;
  });
};

const calculateTotals = () => {
  return {
    totalServices: selectedServices.length,
    totalValue: selectedServices.reduce((sum, service) => sum + service.value, 0),
    averageValue: selectedServices.length > 0 
      ? selectedServices.reduce((sum, service) => sum + service.value, 0) / selectedServices.length 
      : 0
  };
}

return (
  <Box>
    {!showServiceSelection ? (
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                  value={selectedCompany}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                >
                  {(companies || []).map(company => (
                <MenuItem key={company._id} value={company._id}>
                  {company.name}
                </MenuItem>
              ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Contrato</InputLabel>
              <Select
                value={selectedContract || ''}
                onChange={(e) => {
                  console.log("Contrato seleccionado:", e.target.value);
                  setSelectedContract(e.target.value);
                }}
                label="Contrato"
              >
                {contracts.length === 0 ? (
                  <MenuItem value="" disabled>No hay contratos disponibles</MenuItem>
                ) : (
                  contracts.map(contract => (
                    <MenuItem key={contract._id} value={contract._id}>
                      {contract.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained"
              onClick={handleStartPreBilling}
            >
              Comenzar Prefacturación
            </Button>
          </Grid>
        </Grid>
      </Paper>
    ) : (
      <>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Número de Documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearchPatient();
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                onClick={handleSearchPatient}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>

          {patient && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={patient?.fullName || 
                    `${patient?.firstName || ''} ${patient?.secondName || ''} ${patient?.firstLastName || ''} ${patient?.secondLastName || ''}`.trim() || 
                    'Sin nombre disponible'}
                InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                value={patient.birthDate ? formatDate(patient.birthDate) : 'No disponible'}
                InputProps={{ readOnly: true }}
              />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Régimen"
                  value={patient?.regimen || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          )}
        </Paper>

        {patient && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
            <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>CUPS</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow 
                        key={service._id}
                        sx={service.isPrefactured ? { backgroundColor: '#f5f5f5' } : {}}
                      >
                        <TableCell>
                          {service.serviceDate instanceof Date 
                            ? service.serviceDate.toLocaleDateString('es-CO')
                            : typeof service.serviceDate === 'string' 
                              ? service.serviceDate 
                              : ''}
                        </TableCell>
                        <TableCell>{service.cupsCode || ''}</TableCell>
                        <TableCell>{service.description || ''}</TableCell>
                        <TableCell>
                          {service.isPrefactured ? (
                            <Button
                              variant="outlined"
                              size="small"
                              disabled
                              sx={{ color: 'text.secondary' }}
                              title={service.prefacturedAt instanceof Date 
                                ? `Prefacturado el ${service.prefacturedAt.toLocaleDateString('es-CO')}`
                                : 'Prefacturado'}
                            >
                              Ya Prefacturado
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => addToPreBill(service)}
                            >
                              Agregar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>CUPS</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {selectedServices.map((service) => (
                    <TableRow key={service._id}>
                      <TableCell>
                        {formatDate(service.serviceDate) || ''}
                      </TableCell>
                      <TableCell>{service.cupsCode}</TableCell>
                      <TableCell>{service.value}</TableCell>
                      <TableCell>
                        <Button
                          color="error"
                          size="small"
                          onClick={() => {
                            setSelectedServices(selectedServices.filter(s => s._id !== service._id));
                          }}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
        <Grid item xs={12} md={6}>
  <Paper 
    elevation={3} 
    sx={{ 
      p: 2, 
      mt: 2,
      bgcolor: 'primary.light',
      color: 'primary.contrastText'
    }}
  >
    <Typography variant="h6" gutterBottom>
      Resumen de Prefacturación Actual
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="subtitle2">
          Servicios Seleccionados:
        </Typography>
        <Typography variant="h4">
          {selectedServices.length}
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="subtitle2">
          Valor Total:
        </Typography>
        <Typography variant="h4">
          ${calculateTotals().totalValue.toLocaleString()}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2">
          Valor Promedio por Servicio:
        </Typography>
        <Typography variant="h5">
          ${calculateTotals().averageValue.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </Typography>
      </Grid>
    </Grid>
  </Paper>
</Grid>
        {selectedServices.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Autorización"
                value={authorization}
                onChange={(e) => setAuthorization(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Diagnóstico"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={handleSavePreBill}
              >
                Guardar Prefactura
              </Button>
            </Grid>
          </Grid>
          
        )}
        {showServiceSelection && (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={8}>
        <Typography variant="h6">
          Prefacturación Activa - {companies.find(c => c._id === selectedCompany)?.name}
          {' - '}
          {contracts.find(c => c._id === selectedContract)?.name}
        </Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleFinishPrefacturation}
        >
          Finalizar y Exportar
        </Button>
      </Grid>
    </Grid>
  </Paper>
        )}
        {hasActivePreBills && (
  <Box sx={{ mt: 2, mb: 2 }}>
    <Alert 
      severity="info"
      action={
        <Button 
          color="inherit" 
          size="small"
          onClick={() => setShowActivePreBills(true)}
        >
          Ver Prefacturas
        </Button>
      }
    >
      Hay prefacturaciones en progreso para este contrato.
    </Alert>
  </Box>
)}
        {showServiceSelection && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button 
              variant="contained"
              color="secondary"
              onClick={() => setShowServiceSelection(false)}
            >
              Volver a Selección de Empresa/Contrato
            </Button>
            <Button 
              variant="contained"
              color="primary"
              onClick={handleExportPreBills}
            >
              Exportar Prefacturación
            </Button>
          </Box>
        )}
      </>
    )}
    <Dialog
      open={showActivePreBills}
      onClose={() => setShowActivePreBills(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Prefacturaciones en Progreso</DialogTitle>
      <DialogContent>
        <ActivePreBills 
          companyId={selectedCompany}
          contractId={selectedContract}
          onContinuePreBill={handleContinuePreBill}
          onClose={() => setShowActivePreBills(false)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowActivePreBills(false)}>Cerrar</Button>
      </DialogActions>
    </Dialog>
    {isLoading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
    <CircularProgress />
    <Typography variant="body2" sx={{ ml: 2 }}>
      Procesando prefactura...
    </Typography>
  </Box>
)}
    <Snackbar
      open={showAlert}
      autoHideDuration={6000}
      onClose={handleCloseAlert}
    >
      <Alert 
        onClose={handleCloseAlert} 
        severity="warning"
        sx={{ width: '100%' }}
      >
        {alertMessage}
      </Alert>
    </Snackbar>
  </Box>
);
}

export default Services;