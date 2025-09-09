import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  TextField,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  LocalHospital as HospitalIcon,
  Assessment as AssessmentIcon,
  GetApp as ExportIcon,
  CheckCircle as CheckIcon,
  PlayArrow as StartIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  AddCircle as AddCircleIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  Badge as BadgeIcon,
  MedicalServices as DiagnosisIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Importar componentes modernos
import ModernSearchBar from '../components/modern/ModernSearchBar';
import ModernPatientCard from '../components/modern/ModernPatientCard';
import ModernServiceCard from '../components/modern/ModernServiceCard';
import ModernProcessStepper from '../components/modern/ModernProcessStepper';
import ModernMetricsCard from '../components/modern/ModernMetricsCard';
import PatientForm from '../components/PatientForm';

// Importar utilidades existentes
import { formatDate } from '../utils/dateUtils';
import { formatServiceDate } from '../utils/dateFormatter';
import secureStorage from '../utils/secureStorage';

const MainContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`
}));

const SectionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease'
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
  }
}));

const ModernServices = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados existentes (mantenemos la lógica actual)
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para la interfaz moderna
  const [activeStep, setActiveStep] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Estados para funcionalidades nuevas
  const [savedServices, setSavedServices] = useState([]);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [patientNotFound, setPatientNotFound] = useState(false);
  
  // Estados para campos adicionales
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  
  // Estados para diagnósticos CIE-11
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');

  // Calcular paso actual basado en el estado
  useEffect(() => {
    if (!selectedCompany) {
      setActiveStep(0);
    } else if (!selectedContract) {
      setActiveStep(1);
    } else if (!patient) {
      setActiveStep(2);
    } else if (selectedServices.length === 0) {
      setActiveStep(3);
    } else {
      setActiveStep(4);
    }
  }, [selectedCompany, selectedContract, patient, selectedServices.length]);

  // Cargar datos iniciales
  useEffect(() => {
    loadCompanies();
    loadRecentSearches();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/companies', {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      setCompanies([]);
    }
  };

  const loadContracts = async (companyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}/contracts`, {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando contratos:', error);
      setContracts([]);
    }
  };

  const loadRecentSearches = () => {
    try {
      const searches = JSON.parse(localStorage.getItem('recentPatientSearches') || '[]');
      setRecentSearches(searches.slice(0, 5));
    } catch (error) {
      setRecentSearches([]);
    }
  };

  const saveRecentSearch = (documentNumber) => {
    try {
      const searches = JSON.parse(localStorage.getItem('recentPatientSearches') || '[]');
      const updatedSearches = [documentNumber, ...searches.filter(s => s !== documentNumber)].slice(0, 10);
      localStorage.setItem('recentPatientSearches', JSON.stringify(updatedSearches));
      setRecentSearches(updatedSearches.slice(0, 5));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleCompanyChange = (value) => {
    setSelectedCompany(value || '');
    setSelectedContract('');
    setContracts([]);
    
    if (value) {
      loadContracts(value);
    }
  };

  const handleSearchPatient = async (docNumber) => {
    if (!docNumber) {
      docNumber = documentNumber;
    }
    
    const cleanDocNumber = String(docNumber || '').replace(/\D/g, '');
    
    if (cleanDocNumber.length < 6 || cleanDocNumber.length > 12) {
      setAlertMessage('Ingrese un número de documento válido (6-12 dígitos)');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${encodeURIComponent(cleanDocNumber)}`, {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPatient(data.patient || data);
        await loadPatientServices(cleanDocNumber);
        saveRecentSearch(cleanDocNumber);
        setShowMetrics(true);
        setPatientNotFound(false);
        setShowAdditionalFields(true); // Activar campos adicionales
      } else {
        setAlertMessage(data.message || 'Paciente no encontrado');
        setShowAlert(true);
        setPatient(null);
        setPatientNotFound(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Error al buscar paciente');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientServices = async (docNumber) => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/patients/${encodeURIComponent(docNumber)}/services`, {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.services) {
        const processedServices = data.services.map(service => ({
          ...service,
          serviceDate: formatServiceDate(service.serviceDate),
          prefacturedAt: service.prefacturedAt ? formatServiceDate(service.prefacturedAt) : null
        }));
        setServices(processedServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    }
  };

  const addToPreBill = async (service) => {
    if (service.isPrefactured) {
      setAlertMessage('Este servicio ya fue prefacturado');
      setShowAlert(true);
      return;
    }

    try {
      // Buscar tarifa del servicio
      const response = await fetch(`http://localhost:5000/api/cups/${service.cupsCode}/tariff/${selectedContract}`, {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      let tariffData = null;
      if (response.ok) {
        tariffData = await response.json();
      }
      
      const updatedService = {
        ...service,
        contractId: selectedContract,
        company: selectedCompany,
        value: tariffData ? tariffData.value : service.value || 0,
        requiresAuthorization: tariffData ? tariffData.requiresAuthorization : false,
        authorization: authorization,
        diagnosis: diagnosis,
        // Información del médico
        doctorDocumentType: selectedDoctor?.documentType || '',
        doctorDocumentNumber: selectedDoctor?.documentNumber || '',
        doctorName: selectedDoctor?.fullName || '',
        doctorProfessionalCard: selectedDoctor?.professionalCard || '',
        doctorSpecialty: selectedDoctor?.specialty || ''
      };
      
      setSelectedServices(prev => [...prev, updatedService]);
      
      // Opcional: actualizar servicio en BD
      try {
        await fetch(`http://localhost:5000/api/services/${service._id}/assign-contract`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${secureStorage.getItem('token')}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            contractId: selectedContract, 
            company: selectedCompany,
            value: updatedService.value
          })
        });
      } catch (updateError) {
        console.error('Error actualizando servicio:', updateError);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Error al procesar el servicio');
      setShowAlert(true);
    }
  };

  const removeFromPreBill = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s._id !== serviceId));
  };

  const calculateMetrics = () => {
    const totalServices = selectedServices.length;
    const totalValue = selectedServices.reduce((sum, service) => sum + (service.value || 0), 0);
    const averageValue = totalServices > 0 ? totalValue / totalServices : 0;
    const servicesRequiringAuth = selectedServices.filter(s => s.requiresAuthorization).length;
    
    return {
      totalServices,
      totalValue,
      averageValue,
      servicesRequiringAuth,
      authPercentage: totalServices > 0 ? (servicesRequiringAuth / totalServices) * 100 : 0
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Función para guardar servicios temporalmente
  const saveServicesTemporarily = () => {
    setSavedServices([...savedServices, ...selectedServices]);
    setSelectedServices([]);
    setAlertMessage(`Se guardaron ${selectedServices.length} servicios. Puedes seguir agregando más.`);
    setShowAlert(true);
    setActiveStep(2); // Volver a la búsqueda de pacientes
  };

  // Función para crear un nuevo paciente
  const handleCreatePatient = async (patientData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      const data = await response.json();

      if (response.ok) {
        setPatient(data.patient || data);
        setShowCreatePatient(false);
        setPatientNotFound(false);
        setDocumentNumber(patientData.documentNumber);
        setAlertMessage('Paciente creado exitosamente');
        setShowAlert(true);
        
        // Buscar servicios del paciente recién creado
        await loadPatientServices(patientData.documentNumber);
        saveRecentSearch(patientData.documentNumber);
      } else {
        setAlertMessage(data.message || 'Error al crear paciente');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setAlertMessage('Error al crear paciente');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para exportar y finalizar todo
  const exportAndFinalize = async () => {
    const allServices = [...savedServices, ...selectedServices];
    
    if (allServices.length === 0) {
      setAlertMessage('No hay servicios para exportar');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/services/export-prefacturacion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          services: allServices,
          patient: patient,
          company: selectedCompany,
          contract: selectedContract,
          totalServices: allServices.length,
          totalValue: allServices.reduce((sum, service) => sum + (service.value || 0), 0)
        })
      });

      if (response.ok) {
        // Manejar descarga de archivo Excel
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prefacturacion_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setAlertMessage(`Prefacturación exportada exitosamente. Total: ${allServices.length} servicios`);
        setShowAlert(true);
        
        // Limpiar estado
        setSavedServices([]);
        setSelectedServices([]);
        setPatient(null);
        setDocumentNumber('');
        setServices([]);
        setShowMetrics(false);
        setActiveStep(0);
      } else {
        const data = await response.json();
        setAlertMessage(data.message || 'Error al exportar prefacturación');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      setAlertMessage('Error al exportar prefacturación');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para buscar médicos
  const searchDoctors = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setDoctors([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/doctors/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.data || []);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      setDoctors([]);
    }
  };

  // Función para seleccionar médico
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorSearch(doctor ? doctor.fullName : '');
  };

  // Función para buscar diagnósticos CIE-11
  const searchDiagnoses = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setDiagnoses([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/cie11/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${secureStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnoses(data.data || []);
      } else {
        setDiagnoses([]);
      }
    } catch (error) {
      console.error('Error searching diagnoses:', error);
      setDiagnoses([]);
    }
  };

  // Función para seleccionar diagnóstico
  const handleDiagnosisSelect = (diagnosisObj) => {
    setSelectedDiagnosis(diagnosisObj);
    if (diagnosisObj) {
      setDiagnosis(diagnosisObj.code); // Guardar el código en el campo diagnosis
      setDiagnosisSearch(`${diagnosisObj.code} - ${diagnosisObj.description}`);
    } else {
      setDiagnosis('');
      setDiagnosisSearch('');
    }
  };

  return (
    <MainContainer maxWidth="xl">
      {/* Header */}
      <Fade in timeout={800}>
        <Box mb={4}>
          <Typography 
            variant="h3" 
            fontWeight={700}
            color="text.primary"
            gutterBottom
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center'
            }}
          >
            Gestión de Servicios Moderna
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            textAlign="center"
            sx={{ mb: 2 }}
          >
            Sistema inteligente de facturación médica
          </Typography>
        </Box>
      </Fade>

      <Grid container spacing={3}>
        {/* Panel izquierdo - Proceso */}
        <Grid item xs={12} md={4}>
          <Fade in timeout={600}>
            <SectionCard>
              <ModernProcessStepper 
                activeStep={activeStep}
                orientation={isMobile ? 'horizontal' : 'vertical'}
              />
            </SectionCard>
          </Fade>
        </Grid>

        {/* Panel principal */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Paso 1: Selección de empresa y contrato */}
            {activeStep <= 1 && (
              <Fade in timeout={800}>
                <SectionCard>
                  <Box display="flex" alignItems="center" mb={3}>
                    <BusinessIcon color="primary" sx={{ mr: 2, fontSize: '2rem' }} />
                    <Typography variant="h5" fontWeight={600}>
                      Configuración Inicial
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Empresa</InputLabel>
                        <Select
                          value={selectedCompany}
                          onChange={(e) => handleCompanyChange(e.target.value)}
                          label="Empresa"
                          startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action.active' }} />}
                        >
                          {companies.map(company => (
                            <MenuItem key={company._id} value={company._id}>
                              {company.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined" disabled={!selectedCompany}>
                        <InputLabel>Contrato</InputLabel>
                        <Select
                          value={selectedContract}
                          onChange={(e) => setSelectedContract(e.target.value)}
                          label="Contrato"
                          startAdornment={<AssignmentIcon sx={{ mr: 1, color: 'action.active' }} />}
                        >
                          {contracts.map(contract => (
                            <MenuItem key={contract._id} value={contract._id}>
                              {contract.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  {selectedCompany && selectedContract && (
                    <Fade in timeout={600}>
                      <Box mt={3} textAlign="center">
                        <ActionButton
                          variant="contained"
                          color="primary"
                          size="large"
                          startIcon={<StartIcon />}
                          onClick={() => setActiveStep(2)}
                        >
                          Continuar con Paciente
                        </ActionButton>
                      </Box>
                    </Fade>
                  )}
                </SectionCard>
              </Fade>
            )}

            {/* Paso 2: Búsqueda de paciente */}
            {activeStep >= 2 && (
              <Fade in timeout={1000}>
                <SectionCard>
                  <ModernSearchBar
                    value={documentNumber}
                    onChange={setDocumentNumber}
                    onSearch={handleSearchPatient}
                    onClear={() => {
                      setDocumentNumber('');
                      setPatient(null);
                      setServices([]);
                      setSelectedServices([]);
                      setPatientNotFound(false);
                    }}
                    loading={isLoading}
                    recentSearches={recentSearches}
                    onRecentSearchClick={(search) => {
                      setDocumentNumber(search);
                      handleSearchPatient(search);
                    }}
                  />
                  
                  {/* Botón para crear paciente cuando no se encuentra */}
                  {patientNotFound && documentNumber && (
                    <Fade in timeout={600}>
                      <Box mt={3} textAlign="center">
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Paciente no encontrado
                          </Typography>
                          <Typography variant="body2">
                            El documento {documentNumber} no está registrado en el sistema
                          </Typography>
                        </Alert>
                        
                        <ActionButton
                          variant="contained"
                          color="primary"
                          size="large"
                          startIcon={<PersonAddIcon />}
                          onClick={() => setShowCreatePatient(true)}
                        >
                          Crear Nuevo Paciente
                        </ActionButton>
                      </Box>
                    </Fade>
                  )}
                </SectionCard>
              </Fade>
            )}

            {/* Información del paciente */}
            {patient && (
              <Fade in timeout={800}>
                <ModernPatientCard 
                  patient={patient}
                  onEdit={() => {/* Implementar edición si se necesita */}}
                />
              </Fade>
            )}

            {/* Campos adicionales: Autorización, Diagnóstico y Médico */}
            {showAdditionalFields && patient && (
              <Fade in timeout={1000}>
                <SectionCard>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center">
                        <MedicalIcon color="primary" sx={{ mr: 2 }} />
                        <Typography variant="h6" fontWeight={600}>
                          Información Adicional del Servicio
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        {/* Autorización */}
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Autorización"
                            value={authorization}
                            onChange={(e) => setAuthorization(e.target.value)}
                            placeholder="Número de autorización (si aplica)"
                            InputProps={{
                              startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'action.active' }} />
                            }}
                          />
                        </Grid>

                        {/* Diagnóstico CIE-11 */}
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={diagnoses}
                            getOptionLabel={(option) => 
                              `${option.code} - ${option.description}`
                            }
                            value={selectedDiagnosis}
                            onChange={(event, newValue) => handleDiagnosisSelect(newValue)}
                            inputValue={diagnosisSearch}
                            onInputChange={(event, newInputValue) => {
                              setDiagnosisSearch(newInputValue);
                              searchDiagnoses(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Diagnóstico CIE-11"
                                placeholder="Buscar por código o descripción"
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: <DiagnosisIcon sx={{ mr: 1, color: 'action.active' }} />
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props}>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {option.code}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.description}
                                  </Typography>
                                  {option.chapter && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Cap: {option.chapter}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}
                            loading={diagnoses.length === 0 && diagnosisSearch.length > 2}
                            loadingText="Buscando diagnósticos..."
                            noOptionsText="No se encontraron diagnósticos CIE-11"
                            filterOptions={(x) => x} // Usar filtrado del servidor
                          />
                        </Grid>

                        {/* Búsqueda de Médico */}
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={doctors}
                            getOptionLabel={(option) => 
                              `${option.fullName} - ${option.professionalCard} (${option.specialty})`
                            }
                            value={selectedDoctor}
                            onChange={(event, newValue) => handleDoctorSelect(newValue)}
                            inputValue={doctorSearch}
                            onInputChange={(event, newInputValue) => {
                              setDoctorSearch(newInputValue);
                              searchDoctors(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Médico Tratante"
                                placeholder="Buscar por nombre, documento o tarjeta"
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: <BadgeIcon sx={{ mr: 1, color: 'action.active' }} />
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props}>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {option.fullName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.documentType} {option.documentNumber} | 
                                    TP: {option.professionalCard} | 
                                    {option.specialty}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            loading={doctors.length === 0 && doctorSearch.length > 2}
                            loadingText="Buscando médicos..."
                            noOptionsText="No se encontraron médicos"
                          />
                        </Grid>

                        {selectedDoctor && (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Médico seleccionado:
                              </Typography>
                              <Typography variant="body2">
                                <strong>{selectedDoctor.fullName}</strong> - 
                                {selectedDoctor.documentType} {selectedDoctor.documentNumber} | 
                                Tarjeta Profesional: {selectedDoctor.professionalCard} | 
                                Especialidad: {selectedDoctor.specialty}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}

                        {selectedDiagnosis && (
                          <Grid item xs={12}>
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Diagnóstico CIE-11 seleccionado:
                              </Typography>
                              <Typography variant="body2">
                                <strong>{selectedDiagnosis.code}</strong> - {selectedDiagnosis.description}
                                {selectedDiagnosis.chapter && (
                                  <><br />Capítulo: {selectedDiagnosis.chapter}</>
                                )}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </SectionCard>
              </Fade>
            )}

            {/* Servicios Guardados */}
            {savedServices.length > 0 && (
              <Fade in timeout={900}>
                <SectionCard>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      Servicios Guardados
                    </Typography>
                    <Chip 
                      label={`${savedServices.length} servicios guardados`}
                      color="success"
                      variant="filled"
                      icon={<SaveIcon />}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Total acumulado: {formatCurrency(savedServices.reduce((sum, service) => sum + (service.value || 0), 0))}
                  </Typography>
                </SectionCard>
              </Fade>
            )}

            {/* Métricas */}
            {showMetrics && (selectedServices.length > 0 || savedServices.length > 0) && (
              <Fade in timeout={1000}>
                <SectionCard>
                  <Typography variant="h6" fontWeight={600} mb={3}>
                    Resumen de Prefacturación
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <ModernMetricsCard
                        title="Servicios Actuales"
                        value={metrics.totalServices}
                        icon={HospitalIcon}
                        variant="primary"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <ModernMetricsCard
                        title="Servicios Guardados"
                        value={savedServices.length}
                        icon={SaveIcon}
                        variant="success"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <ModernMetricsCard
                        title="Valor Actual"
                        value={metrics.totalValue}
                        formatter={formatCurrency}
                        icon={AssessmentIcon}
                        variant="info"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <ModernMetricsCard
                        title="Total Acumulado"
                        value={savedServices.reduce((sum, service) => sum + (service.value || 0), 0) + metrics.totalValue}
                        formatter={formatCurrency}
                        icon={AssessmentIcon}
                        variant="warning"
                      />
                    </Grid>
                  </Grid>
                </SectionCard>
              </Fade>
            )}

            {/* Servicios disponibles */}
            {services.length > 0 && (
              <Fade in timeout={1200}>
                <SectionCard>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={600}>
                      Servicios Disponibles
                    </Typography>
                    <Chip 
                      label={`${services.length} servicios`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    {services.map((service, index) => (
                      <Grid item xs={12} sm={6} md={4} key={service._id}>
                        <ModernServiceCard
                          service={service}
                          onAddToPreBill={addToPreBill}
                          onViewDetails={(service) => {
                            console.log('Ver detalles:', service);
                          }}
                          showValue={true}
                          animate={true}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </SectionCard>
              </Fade>
            )}

            {/* Servicios seleccionados */}
            {selectedServices.length > 0 && (
              <Fade in timeout={1400}>
                <SectionCard>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={600}>
                      Servicios Seleccionados
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={`${selectedServices.length} servicios`}
                        color="success"
                        variant="filled"
                      />
                      <Chip 
                        label={formatCurrency(metrics.totalValue)}
                        color="success"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {selectedServices.map((service) => (
                      <Grid item xs={12} sm={6} md={4} key={service._id}>
                        <ModernServiceCard
                          service={{...service, isPrefactured: false}}
                          onAddToPreBill={() => removeFromPreBill(service._id)}
                          showValue={true}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ my: 3 }} />
                  
                  <Box textAlign="center">
                    <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="center">
                      <ActionButton
                        variant="outlined"
                        color="primary"
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={saveServicesTemporarily}
                        disabled={selectedServices.length === 0}
                      >
                        Guardar y Seguir Agregando
                      </ActionButton>
                      
                      <ActionButton
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<ExportIcon />}
                        onClick={exportAndFinalize}
                        disabled={selectedServices.length === 0 && savedServices.length === 0}
                      >
                        Finalizar y Exportar Todo
                      </ActionButton>
                    </Stack>
                    
                    {savedServices.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Total a exportar: {savedServices.length + selectedServices.length} servicios
                      </Typography>
                    )}
                  </Box>
                </SectionCard>
              </Fade>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Diálogo para crear paciente */}
      <Dialog
        open={showCreatePatient}
        onClose={() => setShowCreatePatient(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box p={3}>
            <Typography variant="h5" fontWeight={600} gutterBottom color="primary">
              Crear Nuevo Paciente
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Complete los datos del paciente para poder continuar con la facturación
            </Typography>
            
            <PatientForm
              initialData={{ documentNumber: documentNumber }}
              onSubmit={handleCreatePatient}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setShowCreatePatient(false)}
            color="inherit"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity="info"
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </MainContainer>
  );
};

export default ModernServices;