// backend/services/fileExportService.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const csv = require('csv-parser');
const { Transform } = require('stream');
const moment = require('moment');

/**
 * Servicio para exportación de archivos en diferentes formatos
 */
const fileExportService = {
  /**
   * Genera un archivo ZIP con los archivos RIPS
   * @param {string} sourceDir - Directorio donde están los archivos RIPS
   * @param {Object} ripsGeneration - Datos de la generación RIPS
   * @returns {string} - Ruta del archivo ZIP generado
   */
  generateRipsZip: async (sourceDir, ripsGeneration) => {
    // Crear nombre de archivo basado en entidad y fecha
    const zipFilename = `rips_${ripsGeneration.entityCode}_${moment(ripsGeneration.generationDate).format('YYYYMMDD')}.zip`;
    const zipPath = path.join(sourceDir, zipFilename);
    
    // Crear stream para escribir ZIP
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Nivel máximo de compresión
    });
    
    // Manejar eventos del archivo
    output.on('close', () => {
      console.log(`Archivo ZIP creado: ${zipPath} (${archive.pointer()} bytes)`);
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    // Pipe archivo para escribir
    archive.pipe(output);
    
    // Agregar archivos TXT
    const files = await fs.promises.readdir(sourceDir);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(sourceDir, file);
        archive.file(filePath, { name: file });
      }
    }
    
    // Finalizar proceso
    await archive.finalize();
    
    return zipPath;
  },

  /**
   * Genera archivos CSV a partir de los archivos TXT de RIPS
   * @param {string} sourceDir - Directorio donde están los archivos RIPS
   * @param {Object} ripsGeneration - Datos de la generación RIPS
   * @returns {string} - Ruta del archivo ZIP con CSVs
   */
  generateRipsCSV: async (sourceDir, ripsGeneration) => {
    // Crear directorio para CSV
    const csvDir = path.join(sourceDir, 'csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    
    // Obtener archivos TXT
    const files = await fs.promises.readdir(sourceDir);
    const txtFiles = files.filter(file => file.endsWith('.txt'));
    
    // Procesar cada archivo TXT a CSV
    for (const txtFile of txtFiles) {
      const txtPath = path.join(sourceDir, txtFile);
      const csvFile = txtFile.replace('.txt', '.csv');
      const csvPath = path.join(csvDir, csvFile);
      
      // Stream de lectura del TXT
      const readStream = fs.createReadStream(txtPath);
      
      // Stream de escritura del CSV
      const writeStream = fs.createWriteStream(csvPath);
      
      // Transformar TXT a CSV
      await convertTxtToCsv(readStream, writeStream, ripsGeneration.resolution);
    }
    
    // Comprimir directorio CSV en ZIP
    const zipFilename = `rips_${ripsGeneration.entityCode}_${moment(ripsGeneration.generationDate).format('YYYYMMDD')}_csv.zip`;
    const zipPath = path.join(sourceDir, zipFilename);
    
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.pipe(output);
    
    // Agregar directorio CSV completo
    archive.directory(csvDir, 'csv');
    
    await archive.finalize();
    
    return zipPath;
  },

  /**
   * Exporta reporte financiero en formato específico
   * @param {Object} data - Datos del reporte
   * @param {string} format - Formato de exportación (PDF, EXCEL, CSV)
   * @param {string} reportType - Tipo de reporte
   * @returns {string} - Ruta del archivo generado
   */
  exportFinancialReport: async (data, format, reportType) => {
    // Implementar exportación según formato
    const outputDir = path.join(__dirname, '../output/reports');
    
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `report_${reportType}_${moment().format('YYYYMMDD_HHmmss')}`;
    
    switch (format.toUpperCase()) {
      case 'PDF':
        // Lógica para generar PDF
        // Ejemplo simple (en realidad requeriría una biblioteca como PDFKit)
        const pdfPath = path.join(outputDir, `${filename}.pdf`);
        // await generatePdfReport(data, pdfPath, reportType);
        return pdfPath;
        
      case 'EXCEL':
        // Lógica para generar Excel
        // Ejemplo simple (en realidad requeriría una biblioteca como ExcelJS)
        const excelPath = path.join(outputDir, `${filename}.xlsx`);
        // await generateExcelReport(data, excelPath, reportType);
        return excelPath;
        
      case 'CSV':
        // Lógica para generar CSV
        const csvPath = path.join(outputDir, `${filename}.csv`);
        await generateCsvReport(data, csvPath, reportType);
        return csvPath;
        
      default:
        throw new Error(`Formato de exportación no soportado: ${format}`);
    }
  },

  /**
   * Exporta resultados de auditoría en formato específico
   * @param {Object} data - Datos de la auditoría
   * @param {string} format - Formato de exportación (PDF, EXCEL, CSV)
   * @returns {string} - Ruta del archivo generado
   */
  exportAuditResults: async (data, format) => {
    // Implementar exportación según formato
    // Similar a exportFinancialReport
    return await fileExportService.exportFinancialReport(data, format, 'audit');
  }
};

/**
 * Convierte un archivo TXT de RIPS a formato CSV
 * @param {ReadStream} readStream - Stream de lectura del archivo TXT
 * @param {WriteStream} writeStream - Stream de escritura del archivo CSV
 * @param {string} resolution - Resolución RIPS (3374 o 2275)
 * @returns {Promise} - Promesa que se resuelve al finalizar la conversión
 */
async function convertTxtToCsv(readStream, writeStream, resolution) {
  return new Promise((resolve, reject) => {
    // Transformador para líneas
    const lineTransformer = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // Los archivos RIPS ya están en formato CSV (separados por comas)
        // Solo añadimos encabezados si es necesario
        callback(null, chunk);
      }
    });
    
    readStream
      .pipe(csv({ headers: false }))
      .pipe(lineTransformer)
      .pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
  });
}

/**
 * Genera un reporte CSV
 * @param {Object} data - Datos para el reporte
 * @param {string} outputPath - Ruta de salida
 * @param {string} reportType - Tipo de reporte
 * @returns {Promise} - Promesa que se resuelve al finalizar la generación
 */
async function generateCsvReport(data, outputPath, reportType) {
  return new Promise((resolve, reject) => {
    try {
      // Convertir datos a formato CSV
      let csvContent = '';
      
      // Añadir encabezados
      if (data.headers && Array.isArray(data.headers)) {
        csvContent += data.headers.join(',') + '\n';
      }
      
      // Añadir filas
      if (data.rows && Array.isArray(data.rows)) {
        for (const row of data.rows) {
          if (Array.isArray(row)) {
            // Formatear campos y escapar comas si es necesario
            const formattedRow = row.map(field => {
              if (typeof field === 'string' && field.includes(',')) {
                return `"${field}"`;
              }
              return field;
            });
            
            csvContent += formattedRow.join(',') + '\n';
          }
        }
      }
      
      // Escribir archivo
      fs.writeFileSync(outputPath, csvContent);
      resolve(outputPath);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = fileExportService;