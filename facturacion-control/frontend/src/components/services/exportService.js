// src/services/exportService.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Servicio para exportación de datos en diferentes formatos
 */
const exportService = {
  /**
   * Exporta datos a Excel (a través del backend)
   * @param {Object} options Opciones de exportación
   * @returns {Promise} Promesa con el resultado de la exportación
   */
  exportToExcel: async (options) => {
    const { apiEndpoint, filters, columns, data, fileName = 'reporte' } = options;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          columns,
          data
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Exporta datos a PDF usando jsPDF
   * @param {Object} options Opciones de exportación
   * @returns {Promise} Promesa con el resultado de la exportación
   */
  exportToPDF: async (options) => {
    const { 
      data, 
      columns, 
      title = 'Reporte', 
      subtitle = '', 
      fileName = 'reporte',
      orientation = 'landscape',
      pageSize = 'a4'
    } = options;
    
    try {
      // Crear documento PDF
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize
      });
      
      // Añadir título y fecha
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      if (subtitle) {
        doc.setFontSize(12);
        doc.text(subtitle, 14, 30);
      }
      
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, orientation === 'landscape' ? 38 : 40);
      
      // Preparar datos para la tabla
      const tableColumns = columns.map(col => ({
        header: col.label || col.headerName || col.field,
        dataKey: col.field
      }));
      
      const tableData = data.map(row => {
        const formattedRow = {};
        
        columns.forEach(col => {
          let value = row[col.field];
          
          // Formatear según el tipo de datos
          if (col.type === 'currency' || col.field.includes('valor') || col.field.includes('value')) {
            value = formatCurrency(value);
          } else if (col.type === 'date' || col.field.includes('date') || col.field.includes('fecha')) {
            value = formatDate(value);
          }
          
          formattedRow[col.field] = value;
        });
        
        return formattedRow;
      });
      
      // Generar tabla automática
      doc.autoTable({
        startY: orientation === 'landscape' ? 45 : 50,
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey] || '')),
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          // Ajustar anchos de columna según el contenido
          ...tableColumns.reduce((styles, col, index) => {
            if (col.dataKey.includes('nombre') || col.dataKey.includes('name')) {
              styles[index] = { cellWidth: 40 };
            } else if (col.dataKey.includes('descripcion') || col.dataKey.includes('description')) {
              styles[index] = { cellWidth: 60 };
            }
            return styles;
          }, {})
        }
      });
      
      // Agregar número de páginas
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }
      
      // Descargar PDF
      doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      return { success: true };
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Exporta datos a CSV usando Papa Parse
   * @param {Object} options Opciones de exportación
   * @returns {Object} Resultado de la exportación
   */
  exportToCSV: (options) => {
    const { data, columns, fileName = 'reporte' } = options;
    
    try {
      // Preparar datos para CSV
      const csvData = data.map(row => {
        const csvRow = {};
        
        columns.forEach(col => {
          let value = row[col.field];
          
          // Formatear según el tipo de datos
          if (col.type === 'currency' || col.field.includes('valor') || col.field.includes('value')) {
            value = typeof value === 'number' ? value : value ? parseFloat(value.replace(/[^\d.-]/g, '')) : 0;
          } else if (col.type === 'date' || col.field.includes('date') || col.field.includes('fecha')) {
            value = value ? new Date(value).toLocaleDateString() : '';
          }
          
          csvRow[col.label || col.headerName || col.field] = value;
        });
        
        return csvRow;
      });
      
      // Generar CSV con PapaParse
      const csv = Papa.unparse(csvData);
      
      // Crear blob y descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      return { success: false, error: error.message };
    }
  }
};

export default exportService;