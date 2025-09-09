// utils/testValidation.js - Datos de prueba para validar el sistema de importación

import { validateFlexibleDate, validateServiceDate } from './dateValidation';

// Datos de prueba para fechas en diferentes formatos
export const testDatesData = [
  // Formatos válidos
  { input: '1990-01-15', expected: true, description: 'Formato ISO (YYYY-MM-DD)' },
  { input: '15/01/1990', expected: true, description: 'Formato DD/MM/YYYY' },
  { input: '15-01-1990', expected: true, description: 'Formato DD-MM-YYYY' },
  { input: '15.01.1990', expected: true, description: 'Formato DD.MM.YYYY' },
  
  // Formatos con ambigüedad (asume DD/MM/YYYY como estándar colombiano)
  { input: '05/03/1990', expected: true, description: 'Ambiguo, asume DD/MM (5 marzo)' },
  { input: '13/03/1990', expected: true, description: 'No ambiguo DD/MM (13 marzo)' },
  
  // Formatos inválidos
  { input: '32/01/1990', expected: false, description: 'Día inválido (32)' },
  { input: '15/13/1990', expected: false, description: 'Mes inválido (13)' },
  { input: '1990-13-15', expected: false, description: 'Mes inválido en formato ISO' },
  { input: '15-13-1990', expected: false, description: 'Mes inválido en formato DD-MM-YYYY' },
  { input: 'abc', expected: false, description: 'Texto inválido' },
  { input: '', expected: false, description: 'Cadena vacía' },
  { input: null, expected: false, description: 'Valor null' },
  { input: undefined, expected: false, description: 'Valor undefined' }
];

// Función para ejecutar pruebas de validación de fechas
export const runDateValidationTests = () => {
  console.log('🧪 Ejecutando pruebas de validación de fechas...\n');
  
  let passedTests = 0;
  let totalTests = testDatesData.length;
  
  testDatesData.forEach((test, index) => {
    const result = validateFlexibleDate(test.input);
    const passed = result.isValid === test.expected;
    
    console.log(`Test ${index + 1}: ${test.description}`);
    console.log(`  Input: ${JSON.stringify(test.input)}`);
    console.log(`  Expected: ${test.expected ? 'VÁLIDO' : 'INVÁLIDO'}`);
    console.log(`  Result: ${result.isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    if (!result.isValid && result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.isValid && result.date) {
      console.log(`  Parsed Date: ${result.date.toISOString().split('T')[0]}`);
    }
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    if (passed) passedTests++;
  });
  
  console.log(`📊 Resultados: ${passedTests}/${totalTests} pruebas pasaron`);
  console.log(`   Tasa de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  return { passed: passedTests, total: totalTests };
};

// Datos de prueba para pacientes
export const testPatientsData = [
  // Paciente válido
  {
    tipoDocumento: 'CC',
    numeroDocumento: '1065831001',
    primerNombre: 'Juan',
    segundoNombre: 'Carlos',
    primerApellido: 'Pérez',
    segundoApellido: 'Gómez',
    fechaNacimiento: '15/01/1990', // Formato DD/MM/YYYY
    genero: 'M',
    regimen: 'Contributivo',
    municipio: 'Valledupar',
    ciudadNacimiento: 'Valledupar',
    ciudadExpedicion: 'Valledupar'
  },
  // Paciente con fecha en formato ISO
  {
    tipoDocumento: 'TI',
    numeroDocumento: '1065831002',
    primerNombre: 'María',
    primerApellido: 'González',
    fechaNacimiento: '2005-03-20', // Formato YYYY-MM-DD
    genero: 'F',
    regimen: 'subsidiado', // Minúscula para probar tolerancia
    municipio: 'Bogotá'
  },
  // Paciente con errores múltiples
  {
    tipoDocumento: 'XX', // Tipo inválido
    numeroDocumento: '123', // Muy corto
    primerNombre: 'A', // Muy corto
    primerApellido: 'B', // Muy corto
    fechaNacimiento: '32/13/1990', // Fecha inválida
    genero: 'X', // Género inválido
    regimen: 'Otro', // Régimen inválido
    municipio: ''  // Vacío
  }
];

// Datos de prueba para servicios
export const testServicesData = [
  // Servicio válido
  {
    numeroDocumento: '1065831001',
    tipoDocumento: 'CC',
    codigoCups: '890201',
    fechaServicio: '15/01/2024', // DD/MM/YYYY
    descripcion: 'Consulta medicina general',
    valor: 35000
  },
  // Servicio con fecha ISO
  {
    numeroDocumento: '1065831002',
    codigoCups: '890301',
    fechaServicio: '2024-02-10', // YYYY-MM-DD
    descripcion: 'Consulta especializada',
    valor: '50000' // String number
  },
  // Servicio con errores
  {
    numeroDocumento: '123', // Muy corto
    codigoCups: 'XX', // Muy corto
    fechaServicio: '32/13/2024', // Fecha inválida
    descripcion: 'ABC', // Muy corto
    valor: -100 // Valor negativo
  }
];

// Función para probar validación de pacientes
export const testPatientValidation = () => {
  console.log('🧪 Ejecutando pruebas de validación de pacientes...\n');
  
  // Aquí normalmente importarías la función de validación de pacientes
  // desde ImportData.jsx, pero como es un componente, simularemos
  console.log('Los datos de prueba están listos para usar en ImportData.jsx');
  console.log('Pacientes de prueba:', testPatientsData.length);
  console.log('Servicios de prueba:', testServicesData.length);
  
  return testPatientsData;
};

// Exportar todo para uso en desarrollo
export default {
  testDatesData,
  testPatientsData,  
  testServicesData,
  runDateValidationTests,
  testPatientValidation
};