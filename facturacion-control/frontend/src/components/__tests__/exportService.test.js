// src/services/__tests__/exportService.test.js
import exportService from '../exportService';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

// Mock de fetch
global.fetch = jest.fn();

// Mock de jsPDF
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      text: jest.fn(),
      setFontSize: jest.fn(),
      autoTable: jest.fn(),
      save: jest.fn(),
      internal: {
        getNumberOfPages: jest.fn().mockReturnValue(2),
        pageSize: {
          getWidth: jest.fn().mockReturnValue(210),
          getHeight: jest.fn().mockReturnValue(297)
        }
      },
      setPage: jest.fn()
    }))
  };
});

// Mock de Papa Parse
jest.mock('papaparse', () => ({
  unparse: jest.fn().mockReturnValue('mocked,csv,data')
}));

// Mock de URL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock de document.createElement
document.createElement = jest.fn().mockImplementation((tag) => {
  if (tag === 'a') {
    return {
      href: '',
      download: '',
      click: jest.fn(),
      style: {}
    };
  }
  return {};
});

// Mock de document.body
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('exportService', () => {
  beforeEach(() => {
    // Limpieza de mocks
    jest.clearAllMocks();
    
    // Mock de respuesta de fetch por defecto
    global.fetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob())
    });
  });
  
  describe('exportToExcel', () => {
    it('should call fetch with correct parameters', async () => {
      // Datos de prueba
      const options = {
        apiEndpoint: '/reports/export',
        filters: { startDate: '2023-01-01', endDate: '2023-12-31' },
        columns: [{ field: 'name', label: 'Nombre' }],
        data: [{ name: 'Test' }],
        fileName: 'test-report'
      };
      
      // Llamar a la función
      await exportService.exportToExcel(options);
      
      // Verificar que fetch fue llamado correctamente
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reports/export'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
      
      // Verificar que el body contiene los datos correctos
      const callArgs = fetch.mock.calls[0][1];
      const bodyObj = JSON.parse(callArgs.body);
      expect(bodyObj).toEqual({
        filters: options.filters,
        columns: options.columns,
        data: options.data
      });
    });
    
    it('should create and click an anchor element', async () => {
      // Datos de prueba
      const options = {
        apiEndpoint: '/reports/export',
        filters: {},
        columns: [],
        data: [],
        fileName: 'test-report'
      };
      
      // Llamar a la función
      await exportService.exportToExcel(options);
      
      // Verificar que se creó el elemento <a>
      expect(document.createElement).toHaveBeenCalledWith('a');
      
      // Verificar que se configuró correctamente
      const anchorMock = document.createElement.mock.results[0].value;
      expect(anchorMock.download).toMatch(/test-report_.*\.xlsx/);
      
      // Verificar que se añadió y eliminó del DOM
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(anchorMock.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
    
    it('should handle fetch errors', async () => {
      // Mock de error en fetch
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      // Espiar console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Datos de prueba
      const options = {
        apiEndpoint: '/reports/export',
        filters: {},
        columns: [],
        data: []
      };
      
      // Llamar a la función
      const result = await exportService.exportToExcel(options);
      
      // Verificar manejo de error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('exportToPDF', () => {
    it('should create a PDF document with correct configuration', async () => {
      // Datos de prueba
      const options = {
        data: [{ name: 'Test', value: 100 }],
        columns: [
          { field: 'name', label: 'Nombre' },
          { field: 'value', label: 'Valor', type: 'currency' }
        ],
        title: 'Reporte de Prueba',
        subtitle: 'Datos de prueba',
        fileName: 'test-pdf'
      };
      
      // Llamar a la función
      await exportService.exportToPDF(options);
      
      // Verificar que se creó el documento PDF
      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Verificar que se configuró el título y subtítulo
      const pdfInstance = jsPDF.mock.results[0].value;
      expect(pdfInstance.setFontSize).toHaveBeenCalledWith(18);
      expect(pdfInstance.text).toHaveBeenCalledWith('Reporte de Prueba', 14, 22);
      expect(pdfInstance.setFontSize).toHaveBeenCalledWith(12);
      expect(pdfInstance.text).toHaveBeenCalledWith('Datos de prueba', 14, 30);
      
      // Verificar que se llamó a autoTable
      expect(pdfInstance.autoTable).toHaveBeenCalled();
      
      // Verificar que se guardó el documento
      expect(pdfInstance.save).toHaveBeenCalledWith(expect.stringMatching(/test-pdf_.*\.pdf/));
    });
  });
  
  describe('exportToCSV', () => {
    it('should use Papa Parse to generate CSV', () => {
      // Datos de prueba
      const options = {
        data: [{ name: 'Test', value: 100 }],
        columns: [
          { field: 'name', label: 'Nombre' },
          { field: 'value', label: 'Valor', type: 'currency' }
        ],
        fileName: 'test-csv'
      };
      
      // Llamar a la función
      exportService.exportToCSV(options);
      
      // Verificar que Papa.unparse fue llamado con los datos correctos
      expect(Papa.unparse).toHaveBeenCalled();
      
      // Verificar que se creó el elemento <a>
      expect(document.createElement).toHaveBeenCalledWith('a');
      
      // Verificar que se configuró correctamente
      const anchorMock = document.createElement.mock.results[0].value;
      expect(anchorMock.download).toMatch(/test-csv_.*\.csv/);
      
      // Verificar que se añadió y eliminó del DOM
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(anchorMock.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
    
    it('should handle formatting different data types', () => {
      // Datos de prueba con diferentes tipos
      const options = {
        data: [
          { 
            name: 'Test', 
            value: '$1,234.56', 
            date: '2023-01-15T00:00:00.000Z' 
          }
        ],
        columns: [
          { field: 'name', label: 'Nombre' },
          { field: 'value', label: 'Valor', type: 'currency' },
          { field: 'date', label: 'Fecha', type: 'date' }
        ],
        fileName: 'test-csv'
      };
      
      // Llamar a la función
      exportService.exportToCSV(options);
      
      // Verificar que Papa.unparse fue llamado
      expect(Papa.unparse).toHaveBeenCalled();
      
      // Comprobar el primer argumento pasado a Papa.unparse
      const papaArg = Papa.unparse.mock.calls[0][0];
      
      // Los datos deben estar correctamente formateados
      expect(papaArg).toHaveLength(1);
      expect(papaArg[0]).toHaveProperty('Nombre', 'Test');
      // El valor debe ser un número, no una cadena con formato moneda
      expect(typeof papaArg[0].Valor).toBe('number');
    });
  });
});