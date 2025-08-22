// src/utils/excelUtils.js
import ExcelJS from 'exceljs'; 
// Definir los campos disponibles
const availableFields = [
  { id: 'documentNumber', label: 'Número de Documento' },
  { id: 'documentType', label: 'Tipo de Documento' },
  { id: 'firstName', label: 'Primer Nombre' },
  { id: 'secondName', label: 'Segundo Nombre' },
  { id: 'firstLastName', label: 'Primer Apellido' },
  { id: 'secondLastName', label: 'Segundo Apellido' },
  { id: 'birthDate', label: 'Fecha de Nacimiento' },
  { id: 'serviceDate', label: 'Fecha de Servicio' },
  { id: 'cupsCode', label: 'Código CUPS' },
  { id: 'description', label: 'Descripción' },
  { id: 'value', label: 'Valor' },
  { id: 'status', label: 'Estado' },
  // Añade más campos según necesites
];

/**
 * Exporta datos a un archivo Excel
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {Array<string>} fields - Array de IDs de campos a exportar
 * @param {Object} filters - Objeto con filtros aplicados (opcional)
 * @returns {Promise<ExcelJS.Workbook>} Workbook de Excel
 */
export const exportToExcel = async (data, fields, filters = {}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Validar campos
    const validFields = fields.filter(field => 
      availableFields.some(f => f.id === field)
    );

    if (validFields.length === 0) {
      throw new Error('No se especificaron campos válidos para exportar');
    }

    // Agregar encabezados
    const headers = validFields.map(field => 
      availableFields.find(f => f.id === field)?.label || field
    );
    worksheet.addRow(headers);

    // Agregar datos
    data.forEach(row => {
      const rowData = validFields.map(field => {
        const value = row[field];
        // Formatear fechas si es necesario
        if (field.includes('Date') && value) {
          return new Date(value).toLocaleDateString('es-CO');
        }
        return value;
      });
      worksheet.addRow(rowData);
    });

    // Aplicar estilos
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Ajustar anchos de columna
    worksheet.columns.forEach((column, index) => {
      const maxLength = [headers[index].length].concat(
        data.map(row => String(row[validFields[index]] || '').length)
      ).reduce((max, len) => Math.max(max, len));
      
      column.width = Math.min(Math.max(maxLength + 2, 10), 30);
    });

    // Agregar filtros si existen
    if (Object.keys(filters).length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Filtros Aplicados:']);
      Object.entries(filters).forEach(([key, value]) => {
        worksheet.addRow([key, value]);
      });
    }

    return workbook;
  } catch (error) {
    console.error('Error generando Excel:', error);
    throw error;
  }
};

// Exportar también los campos disponibles para uso en otros componentes
export const getAvailableFields = () => availableFields;

// Función helper para generar el nombre del archivo
export const generateExcelFileName = (prefix = 'reporte') => {
  const date = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
  return `${prefix}_${date}.xlsx`;
};