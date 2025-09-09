// src/pages/ImportData.jsx
import React, { useState } from 'react';
import secureStorage from '../utils/secureStorage';
import { validateFlexibleDate, validateServiceDate, getDateErrorMessage } from '../utils/dateValidation';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert, 
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow 
} from '@mui/material';
import * as XLSX from 'xlsx';
import { CloudUpload } from '@mui/icons-material';
import {Download} from "@mui/icons-material";

function ImportData() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [importResults, setImportResults] = useState(null);
  
  const downloadTemplate = async (type) => {
    try {
      const token = secureStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/import/template/${type}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error al descargar la plantilla');
    }
  };

  // Mapeo de campos del Excel (español) a nombres de validación (inglés)
  const mapPatientFields = (row) => {
    const fieldMapping = {
      'tipoDocumento': 'documentType',
      'numeroDocumento': 'documentNumber',
      'primerNombre': 'firstName',
      'segundoNombre': 'secondName',
      'primerApellido': 'firstLastName',
      'segundoApellido': 'secondLastName',
      'fechaNacimiento': 'birthDate',
      'genero': 'gender',
      'regimen': 'regimen',
      'municipio': 'municipality',
      'ciudadNacimiento': 'birthCity',
      'ciudadExpedicion': 'expeditionCity'
    };

    const mappedRow = {};
    
    // Mapear campos usando la tabla de conversión
    Object.keys(row).forEach(key => {
      const mappedKey = fieldMapping[key] || key;
      mappedRow[mappedKey] = row[key];
    });

    return mappedRow;
  };

  // Validación de pacientes
  const validatePatientData = (row) => {
    // Mapear campos de español a inglés para validación
    const mappedRow = mapPatientFields(row);
    
    // Solo los campos realmente obligatorios (usando nombres en inglés)
    // Nota: régimen puede ser opcional para algunos tipos de documentos como CNV
    const requiredFields = [
      'documentType',
      'documentNumber',
      'firstName',
      'firstLastName',
      'birthDate',
      'municipality'
    ];

    const errors = [];
    
    // Validar campos obligatorios
    for (const field of requiredFields) {
      if (!mappedRow.hasOwnProperty(field) || mappedRow[field] === null || mappedRow[field] === '' || mappedRow[field] === undefined) {
        const spanishFieldName = {
          'documentType': 'tipoDocumento',
          'documentNumber': 'numeroDocumento', 
          'firstName': 'primerNombre',
          'firstLastName': 'primerApellido',
          'birthDate': 'fechaNacimiento',
          'regimen': 'regimen',
          'municipality': 'municipio'
        };
        errors.push(`El campo ${spanishFieldName[field] || field} es obligatorio`);
      }
    }

    // Validaciones específicas solo si el campo existe y tiene valor (usar campos mapeados)
    if (mappedRow.documentType) {
      const normalizedDocType = mappedRow.documentType.toString().toUpperCase().trim();
      console.log(`Validando tipo documento: "${mappedRow.documentType}" -> "${normalizedDocType}"`);
      
      // Mapear nombres completos a abreviaciones
      const docTypeMapping = {
        'CEDULA DE CIUDADANIA': 'CC',
        'CEDULA CIUDADANIA': 'CC',
        'CEDULA': 'CC',
        'TARJETA DE IDENTIDAD': 'TI',
        'TARJETA IDENTIDAD': 'TI',
        'CEDULA DE EXTRANJERIA': 'CE',
        'CEDULA EXTRANJERIA': 'CE',
        'REGISTRO CIVIL': 'RC',
        'PASAPORTE': 'PT',
        'PASAPORTE EXTRANJERO': 'PE',
        'PERMISO ESPECIAL': 'PA',
        'PERMISO DE PROTECCION TEMPORAL': 'PPT',
        'PERMISO DE PROTECCIÓN TEMPORAL': 'PPT',
        'PPT': 'PPT',
        'CERTIFICADO DE NACIDO VIVO': 'CNV',
        'CERTIFICADO NACIDO VIVO': 'CNV',
        'NACIDO VIVO': 'CNV',
        'SALVOCONDUCTO': 'SC'
      };
      
      const finalDocType = docTypeMapping[normalizedDocType] || normalizedDocType;
      
      if (!['CC', 'TI', 'CE', 'PT', 'RC', 'PE', 'PA', 'PPT', 'CNV', 'SC'].includes(finalDocType)) {
        errors.push(`Tipo de documento inválido (debe ser CC, TI, CE, RC, PT, PE, PA, PPT, CNV, SC). Recibido: "${mappedRow.documentType}"`);
      } else {
        // Actualizar el valor mapeado para el backend
        mappedRow.documentType = finalDocType;
      }
    }

    if (mappedRow.gender) {
      const normalizedGender = mappedRow.gender.toString().toUpperCase().trim();
      console.log(`Validando género: "${mappedRow.gender}" -> "${normalizedGender}"`);
      if (!['M', 'F', 'MASCULINO', 'FEMENINO'].includes(normalizedGender)) {
        errors.push(`Género inválido (debe ser M, F, Masculino o Femenino). Recibido: "${mappedRow.gender}"`);
      }
    }

    if (mappedRow.regimen) {
      const normalizedRegimen = mappedRow.regimen.toString().toLowerCase().trim();
      console.log(`Validando régimen: "${mappedRow.regimen}" -> "${normalizedRegimen}"`);
      
      // Mapear regímenes extendidos a valores básicos
      let finalRegimen = normalizedRegimen;
      if (normalizedRegimen.includes('contributivo')) {
        finalRegimen = 'contributivo';
      } else if (normalizedRegimen.includes('subsidiado')) {
        finalRegimen = 'subsidiado';
      }
      
      if (!['contributivo', 'subsidiado'].includes(finalRegimen)) {
        errors.push(`Régimen inválido (debe ser Contributivo o Subsidiado). Recibido: "${mappedRow.regimen}"`);
      } else {
        // Actualizar el valor mapeado para el backend
        mappedRow.regimen = finalRegimen === 'contributivo' ? 'Contributivo' : 'Subsidiado';
      }
    }

    // Validar número de documento
    if (mappedRow.documentNumber) {
      const docNumber = mappedRow.documentNumber.toString().trim();
      if (docNumber.length < 6 || docNumber.length > 15) {
        errors.push('Número de documento debe tener entre 6 y 15 caracteres');
      }
      if (!/^\d+$/.test(docNumber)) {
        errors.push('Número de documento debe contener solo números');
      }
    }

    // Validar nombres (no pueden estar vacíos si existen)
    if (mappedRow.firstName && mappedRow.firstName.toString().trim().length < 2) {
      errors.push('Primer nombre debe tener al menos 2 caracteres');
    }

    if (mappedRow.firstLastName && mappedRow.firstLastName.toString().trim().length < 2) {
      errors.push('Primer apellido debe tener al menos 2 caracteres');
    }

    // Validar nombres opcionales si existen
    if (mappedRow.secondName && mappedRow.secondName.toString().trim().length < 2) {
      errors.push('Segundo nombre debe tener al menos 2 caracteres si se proporciona');
    }

    if (mappedRow.secondLastName && mappedRow.secondLastName.toString().trim().length < 2) {
      errors.push('Segundo apellido debe tener al menos 2 caracteres si se proporciona');
    }

    // Validar formato de fecha usando el nuevo validador flexible
    if (mappedRow.birthDate) {
      const dateValidation = validateFlexibleDate(mappedRow.birthDate);
      if (!dateValidation.isValid) {
        errors.push(`Fecha de nacimiento inválida: ${dateValidation.error}`);
      }
    }

    // Validar régimen - obligatorio para la mayoría de documentos, opcional para CNV y SC
    const docTypeNoRequiresRegimen = ['CNV', 'SC']; // Certificado de nacido vivo y salvoconducto pueden no tener régimen inicialmente
    if (!docTypeNoRequiresRegimen.includes(mappedRow.documentType)) {
      if (!mappedRow.regimen || mappedRow.regimen === '') {
        errors.push('El campo régimen es obligatorio para este tipo de documento');
      }
    }

    // Campos opcionales no necesitan validación a menos que tengan valor
    const optionalFields = ['secondName', 'secondLastName', 'gender'];
    console.log('Campos opcionales presentes:', optionalFields.filter(field => mappedRow[field]));

    if (errors.length > 0) {
      console.log('Errores de validación encontrados:', errors);
      console.log('Datos que causaron errores:', mappedRow);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  };

  const validateServiceData = (row) => {
    const requiredFields = [
      'numeroDocumento',
      'codigoCups',
      'fechaServicio'
    ];
  
    const errors = [];
  
    // Validar campos requeridos
    for (const field of requiredFields) {
      if (!row.hasOwnProperty(field) || row[field] === null || row[field] === '') {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }
  
    // Validar formato de fecha de servicio usando el nuevo validador flexible
    if (row.fechaServicio) {
      const dateValidation = validateServiceDate(row.fechaServicio);
      if (!dateValidation.isValid) {
        errors.push(`Fecha de servicio inválida: ${dateValidation.error}`);
      }
    }
  
    // El valor se asignará automáticamente según el contrato y tarifa de la empresa
    // Por lo tanto, no validamos ni requerimos el campo valor
  
    // Validar numeroDocumento no sea null o vacío
    if (!row.numeroDocumento || row.numeroDocumento.toString().trim() === '') {
      errors.push('El número de documento es obligatorio');
    } else {
      const docNumber = row.numeroDocumento.toString().trim();
      if (docNumber.length < 6 || docNumber.length > 15) {
        errors.push('Número de documento debe tener entre 6 y 15 caracteres');
      }
      if (!/^\d+$/.test(docNumber)) {
        errors.push('Número de documento debe contener solo números');
      }
    }

    // Validar código CUPS
    if (row.codigoCups) {
      const cupsCode = row.codigoCups.toString().trim();
      if (cupsCode.length < 4 || cupsCode.length > 10) {
        errors.push('Código CUPS debe tener entre 4 y 10 caracteres');
      }
      if (!/^[A-Za-z0-9]+$/.test(cupsCode)) {
        errors.push('Código CUPS debe contener solo letras y números');
      }
    }

    // Validar descripción si existe
    if (row.descripcion && row.descripcion.toString().trim().length < 5) {
      errors.push('Descripción debe tener al menos 5 caracteres si se proporciona');
    }
  
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
  
    return { 
      isValid: true, 
      data: {
        ...row,
        contratoId: row.contratoId || '',
        descripcion: row.descripcion || '',
        autorizacion: row.autorizacion || '',
        diagnostico: row.diagnostico || ''
        // Nota: el valor se asignará automáticamente según tarifa del contrato
      }
    };
  };

  // Validación específica para ciudades
  const validateCityData = (row) => {
    const requiredFields = ['nombre', 'departamento'];
    const errors = [];

    // Validar campos obligatorios
    for (const field of requiredFields) {
      if (!row.hasOwnProperty(field) || row[field] === null || row[field] === '') {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }

    // Validar que nombre no sea muy corto o muy largo
    if (row.nombre && (typeof row.nombre !== 'string' || row.nombre.trim().length < 2 || row.nombre.trim().length > 100)) {
      errors.push('El nombre debe tener entre 2 y 100 caracteres');
    }

    // Validar que departamento no sea muy corto o muy largo
    if (row.departamento && (typeof row.departamento !== 'string' || row.departamento.trim().length < 2 || row.departamento.trim().length > 100)) {
      errors.push('El departamento debe tener entre 2 y 100 caracteres');
    }

    // Validar código si está presente (opcional)
    if (row.codigo && (typeof row.codigo !== 'string' || row.codigo.trim().length > 20)) {
      errors.push('El código debe tener máximo 20 caracteres');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  };

  // Mapeo de campos del Excel para médicos (español) a nombres de validación (inglés)
  const mapDoctorFields = (row) => {
    const fieldMapping = {
      'tipoDocumento': 'documentType',
      'numeroDocumento': 'documentNumber',
      'primerNombre': 'firstName',
      'segundoNombre': 'secondName',
      'primerApellido': 'firstLastName',
      'segundoApellido': 'secondLastName',
      'tarjetaProfesional': 'professionalCard',
      'especialidad': 'specialty',
      'codigoEspecialidad': 'specialtyCode',
      'email': 'email',
      'telefono': 'phone'
    };

    const mappedRow = {};
    
    // Mapear campos usando la tabla de conversión
    Object.keys(row).forEach(key => {
      const mappedKey = fieldMapping[key] || key;
      mappedRow[mappedKey] = row[key];
    });

    return mappedRow;
  };

  // Validación de médicos
  const validateDoctorData = (row) => {
    // Mapear campos de español a inglés para validación
    const mappedRow = mapDoctorFields(row);
    
    const requiredFields = [
      'documentType',
      'documentNumber', 
      'firstName',
      'firstLastName',
      'professionalCard',
      'specialty'
    ];

    const errors = [];
    
    // Validar campos obligatorios
    for (const field of requiredFields) {
      if (!mappedRow.hasOwnProperty(field) || mappedRow[field] === null || mappedRow[field] === '') {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }

    // Validaciones específicas
    if (mappedRow.documentType) {
      const normalizedDocType = mappedRow.documentType.toString().toUpperCase().trim();
      if (!['CC', 'CE', 'TI', 'RC', 'PA', 'MS', 'AS', 'PE', 'PPT', 'CNV', 'SC'].includes(normalizedDocType)) {
        errors.push('Tipo de documento inválido (debe ser CC, CE, TI, RC, PA, MS, AS, PE, PPT, CNV, SC)');
      }
    }

    // Validar número de documento
    if (mappedRow.documentNumber) {
      const docNumber = mappedRow.documentNumber.toString().trim();
      if (docNumber.length < 6 || docNumber.length > 15) {
        errors.push('Número de documento debe tener entre 6 y 15 caracteres');
      }
      if (!/^\d+$/.test(docNumber)) {
        errors.push('Número de documento debe contener solo números');
      }
    }

    // Validar tarjeta profesional
    if (mappedRow.professionalCard) {
      const card = mappedRow.professionalCard.toString().trim();
      if (card.length < 3 || card.length > 20) {
        errors.push('Tarjeta profesional debe tener entre 3 y 20 caracteres');
      }
    }

    // Validar especialidad
    if (mappedRow.specialty && mappedRow.specialty.toString().trim().length < 5) {
      errors.push('Especialidad debe tener al menos 5 caracteres');
    }

    // Validar nombres
    if (mappedRow.firstName && mappedRow.firstName.toString().trim().length < 2) {
      errors.push('Primer nombre debe tener al menos 2 caracteres');
    }

    if (mappedRow.firstLastName && mappedRow.firstLastName.toString().trim().length < 2) {
      errors.push('Primer apellido debe tener al menos 2 caracteres');
    }

    // Validar email si existe
    if (mappedRow.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedRow.email)) {
      errors.push('Email inválido');
    }

    // Validar teléfono si existe
    if (mappedRow.phone) {
      const phone = mappedRow.phone.toString().replace(/\D/g, '');
      if (phone.length < 7 || phone.length > 15) {
        errors.push('Teléfono debe tener entre 7 y 15 dígitos');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  // Validación de códigos CIE-11
  const validateCIE11Data = (row) => {
    const requiredFields = [
      'code',
      'description',
      'chapter'
    ];

    const errors = [];
    
    // Validar campos obligatorios
    for (const field of requiredFields) {
      if (!row.hasOwnProperty(field) || row[field] === null || row[field] === '') {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }

    // Validaciones específicas
    if (row.code && (typeof row.code !== 'string' || row.code.trim().length < 2 || row.code.trim().length > 20)) {
      errors.push('El código debe tener entre 2 y 20 caracteres');
    }

    // Validar formato del código CIE-11
    if (row.code) {
      const cieCode = row.code.toString().trim().toUpperCase();
      // Patrón básico para códigos CIE-11: pueden contener letras, números y puntos
      if (!/^[A-Z0-9.]+$/.test(cieCode)) {
        errors.push('El código CIE-11 debe contener solo letras, números y puntos');
      }
    }

    if (row.description && (typeof row.description !== 'string' || row.description.trim().length < 10)) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    if (row.chapter && row.chapter.toString().trim().length < 5) {
      errors.push('El capítulo debe tener al menos 5 caracteres');
    }

    if (row.gender) {
      const normalizedGender = row.gender.toString().toUpperCase().trim();
      if (!['M', 'F', 'U'].includes(normalizedGender)) {
        errors.push('Género inválido (debe ser M, F o U)');
      }
    }

    if (row.minAge !== undefined && row.minAge !== null) {
      const minAge = parseInt(row.minAge);
      if (isNaN(minAge) || minAge < 0 || minAge > 120) {
        errors.push('Edad mínima inválida (debe ser un número entre 0 y 120)');
      }
    }

    if (row.maxAge !== undefined && row.maxAge !== null) {
      const maxAge = parseInt(row.maxAge);
      if (isNaN(maxAge) || maxAge < 0 || maxAge > 120) {
        errors.push('Edad máxima inválida (debe ser un número entre 0 y 120)');
      }
    }

    // Validar que maxAge >= minAge si ambos están presentes
    if (row.minAge !== undefined && row.maxAge !== undefined && 
        row.minAge !== null && row.maxAge !== null) {
      const minAge = parseInt(row.minAge);
      const maxAge = parseInt(row.maxAge);
      if (!isNaN(minAge) && !isNaN(maxAge) && maxAge < minAge) {
        errors.push('La edad máxima debe ser mayor o igual a la edad mínima');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  // Función de manejo de archivos 
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
  
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportResults(null); 
  
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { 
            type: 'array',
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
          });
          
          const sheetName = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
          if (rawData.length === 0) {
            throw new Error('El archivo está vacío');
          }
  
          console.log('Datos originales del Excel:', rawData[0]);
          
          // Procesar los datos - dejar las fechas como vienen para que el validador las procese
          const data = rawData.map(row => {
            const processed = {...row};
            
            // No pre-procesar las fechas aquí, dejar que el validador flexible las maneje
            // Si viene como Date de Excel, convertir a string para validación uniforme
            if (processed.fechaNacimiento instanceof Date) {
              processed.fechaNacimiento = processed.fechaNacimiento.toISOString().split('T')[0];
            }
            
            if (processed.fechaServicio instanceof Date) {
              processed.fechaServicio = processed.fechaServicio.toISOString().split('T')[0];
            }
            
            return processed;
          });
  
          console.log('Datos procesados:', data[0]);
          
          // Mostrar vista previa
          setPreview(data.slice(0, 5));
  
          // Validar cada fila según el tipo
          const errors = [];
          data.forEach((row, index) => {
            let validationResult;
            
            if (type === 'patients') {
              validationResult = validatePatientData(row);
            } else if (type === 'services') {
              validationResult = validateServiceData(row);
            } else if (type === 'cities') {
              validationResult = validateCityData(row);
            } else if (type === 'doctors') {
              validationResult = validateDoctorData(row);
            } else if (type === 'cie11') {
              validationResult = validateCIE11Data(row);
            } else {
              validationResult = { isValid: false, errors: ['Tipo de importación no válido'] };
            }
  
            if (!validationResult.isValid) {
              errors.push(`Error en la fila ${index + 1}: ${validationResult.errors.join(', ')}`);
            }
          });
  
          if (errors.length > 0) {
            throw new Error(`Se encontraron errores en los datos:\n${errors.join('\n')}`);
          }
  
          // Enviar al servidor datos originales (en español) con normalizaciones aplicadas
          const originalData = rawData.map(row => {
            const processed = {...row};
            
            // Procesar fechas - convertir a formato ISO que MongoDB entiende
            if (processed.fechaNacimiento) {
              if (processed.fechaNacimiento instanceof Date) {
                processed.fechaNacimiento = processed.fechaNacimiento.toISOString().split('T')[0];
              } else if (typeof processed.fechaNacimiento === 'string') {
                // Usar el validador de fechas flexible que ya tenemos
                const dateValidation = validateFlexibleDate(processed.fechaNacimiento);
                if (dateValidation.isValid && dateValidation.parsedDate) {
                  processed.fechaNacimiento = dateValidation.parsedDate.toISOString().split('T')[0];
                }
              }
            }
            
            if (processed.fechaServicio) {
              if (processed.fechaServicio instanceof Date) {
                processed.fechaServicio = processed.fechaServicio.toISOString().split('T')[0];
              } else if (typeof processed.fechaServicio === 'string') {
                // Usar el validador de fechas flexible para fechas de servicio
                const dateValidation = validateServiceDate(processed.fechaServicio);
                if (dateValidation.isValid && dateValidation.parsedDate) {
                  processed.fechaServicio = dateValidation.parsedDate.toISOString().split('T')[0];
                }
              }
            }
            
            // Aplicar normalización de tipos de documento
            if (processed.tipoDocumento) {
              const normalizedDocType = processed.tipoDocumento.toString().toUpperCase().trim();
              const docTypeMapping = {
                'CEDULA DE CIUDADANIA': 'CC',
                'CEDULA CIUDADANIA': 'CC',
                'CEDULA': 'CC',
                'TARJETA DE IDENTIDAD': 'TI',
                'TARJETA IDENTIDAD': 'TI',
                'CEDULA DE EXTRANJERIA': 'CE',
                'CEDULA EXTRANJERIA': 'CE',
                'REGISTRO CIVIL': 'RC',
                'PASAPORTE': 'PT',
                'PASAPORTE EXTRANJERO': 'PE',
                'PERMISO ESPECIAL': 'PA',
                'PERMISO DE PROTECCION TEMPORAL': 'PPT',
                'PERMISO DE PROTECCIÓN TEMPORAL': 'PPT',
                'PPT': 'PPT',
                'CERTIFICADO DE NACIDO VIVO': 'CNV',
                'CERTIFICADO NACIDO VIVO': 'CNV',
                'NACIDO VIVO': 'CNV',
                'SALVOCONDUCTO': 'SC'
              };
              processed.tipoDocumento = docTypeMapping[normalizedDocType] || normalizedDocType;
            }
            
            // Aplicar normalización de régimen
            if (processed.regimen) {
              const normalizedRegimen = processed.regimen.toString().toLowerCase().trim();
              if (normalizedRegimen.includes('contributivo')) {
                processed.regimen = 'Contributivo';
              } else if (normalizedRegimen.includes('subsidiado')) {
                processed.regimen = 'Subsidiado';
              }
            }
            
            return processed;
          });
          
          const token = secureStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/import/${type}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ data: originalData })
          });
      
          const result = await response.json();
          console.log('Respuesta del servidor:', result);
          
          if (!response.ok) {
            throw new Error(result.message);
          }
      
          setSuccess(result.message);
          if (result.details) {
            setImportResults(result.details);
          }
          setPreview([]);
      
        } catch (error) {
          console.error('Error procesando archivo:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
  
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Importación Masiva de Datos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Pacientes
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Cargar Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'patients')}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('patients')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Campos Obligatorios:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - tipoDocumento (CC, TI, CE, RC, PT, PA, PE, PPT, CNV, SC o texto completo como "REGISTRO CIVIL", "Permiso de Protección Temporal")<br />
              - numeroDocumento (número de identificación)<br />
              - primerNombre (primer nombre)<br />
              - primerApellido (primer apellido)<br />
              - fechaNacimiento (múltiples formatos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)<br />
              - regimen (Contributivo/Subsidiado - acepta variaciones como "Contributivo cotizante")<br />
              - municipio (municipio)
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Campos Opcionales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - segundoNombre (segundo nombre)<br />
              - segundoApellido (segundo apellido)<br />
              - genero (M/F o texto completo como "Masculino/Femenino")<br />
              - regimen (opcional para CNV y SC, obligatorio para otros documentos)
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
              <strong>Tipos de documento soportados:</strong><br />
              CC: Cédula de Ciudadanía | TI: Tarjeta de Identidad | CE: Cédula de Extranjería<br />
              RC: Registro Civil | PPT: Permiso de Protección Temporal | CNV: Certificado de Nacido Vivo<br />
              PT: Pasaporte | PA: Permiso Especial | PE: Pasaporte Extranjero | SC: Salvoconducto
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Servicios
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Cargar Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'services')}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('services')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Campos Obligatorios:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - numeroDocumento (número de identificación del paciente)<br />
              - codigoCups (código del servicio)<br />
              - fechaServicio (múltiples formatos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Campos Opcionales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - descripcion (descripción del servicio)<br />
              - ciudadNacimiento (ciudad de nacimiento del paciente)<br />
              - ciudadExpedicion (ciudad de expedición del documento)
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
              <strong>Nota:</strong> El valor del servicio se asignará automáticamente según el contrato y tarifa de cada empresa. Si no se encuentra el paciente con el número de documento, se creará automáticamente usando los datos opcionales proporcionados. Los campos de autorización y diagnóstico se manejarán directamente en el módulo de servicios.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Médicos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Cargar Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'doctors')}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('doctors')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Campos Obligatorios:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - documentType (CC, CE, TI, RC, PA, MS, AS, PE)<br />
              - documentNumber (número de identificación)<br />
              - firstName (primer nombre)<br />
              - firstLastName (primer apellido)<br />
              - professionalCard (tarjeta profesional)<br />
              - specialty (especialidad médica)
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Campos Opcionales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - secondName (segundo nombre)<br />
              - secondLastName (segundo apellido)<br />
              - email (correo electrónico)<br />
              - phone (teléfono)<br />
              - specialtyCode (código de especialidad)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Códigos CIE-11
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Cargar Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'cie11')}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('cie11')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Campos Obligatorios:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - code (código CIE-11, ej: 1A00, 8A61.1)<br />
              - description (descripción del diagnóstico)<br />
              - chapter (capítulo CIE-11)
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Campos Opcionales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - subcategory (subcategoría)<br />
              - billable (true/false, por defecto true)<br />
              - gender (M/F/U, por defecto U)<br />
              - minAge (edad mínima en años)<br />
              - maxAge (edad máxima en años)<br />
              - notes (notas adicionales)
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
              <strong>Nota:</strong> Los códigos CIE-11 seguirán el estándar del Ministerio de Salud de Colombia.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Importar Ciudades
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <input
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                id="cities-file-input"
                type="file"
                onChange={(e) => handleFileUpload(e, 'cities')}
              />
              <label htmlFor="cities-file-input">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                >
                  Cargar Archivo
                </Button>
              </label>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadTemplate('cities')}
              >
                Descargar Plantilla
              </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Formato requerido (Excel):
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - nombre (nombre de la ciudad)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - departamento (departamento al que pertenece)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - codigo (código DANE opcional)
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
              Nota: Las ciudades se usarán para autocompletar los campos de ciudad de nacimiento y expedición.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {preview.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Vista Previa (primeros 5 registros)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(preview[0]).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
              {preview.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row).map(([, value], i) => (
                    <TableCell key={i}>
                      {value instanceof Date 
                        ? (isNaN(value.getTime()) ? 'Fecha inválida' : value.toISOString().split('T')[0])  // Manejo de fechas inválidas
                        : typeof value === 'object' && value !== null
                          ? JSON.stringify(value)  // Para otros objetos
                          : value  // Mantener el valor como está para mostrar en la UI
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
        {importResults && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resultados de la importación
          </Typography>
          
          {importResults.success.length > 0 && (
            <>
              <Typography variant="subtitle1" color="success.main">
                Pacientes importados exitosamente: {importResults.success.length}
              </Typography>
              <Box sx={{ mb: 2 }}>
                {importResults.success.slice(0, 5).map((patient, index) => (
                  <Typography key={index} variant="body2">
                    • {patient.name} (Doc: {patient.documentNumber})
                  </Typography>
                ))}
                {importResults.success.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    Y {importResults.success.length - 5} más...
                  </Typography>
                )}
              </Box>
            </>
          )}
          
          {importResults.duplicates.length > 0 && (
            <>
              <Typography variant="subtitle1" color="warning.main">
                Pacientes duplicados (no importados): {importResults.duplicates.length}
              </Typography>
              <Box sx={{ mb: 2 }}>
                {importResults.duplicates.slice(0, 5).map((patient, index) => (
                  <Typography key={index} variant="body2">
                    • {patient.name} (Doc: {patient.documentNumber})
                  </Typography>
                ))}
                {importResults.duplicates.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    Y {importResults.duplicates.length - 5} más...
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default ImportData;