// backend/controllers/ripsController.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Modelos
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Entity = require('../models/Entity');
const RipsGeneration = require('../models/RipsGeneration');

// Servicios
const rips3374Service = require('../services/rips/rips3374Service');
const rips2275Service = require('../services/rips/rips2275Service');
const fileExportService = require('../services/fileExportService');

/**
 * Controlador para gestión de RIPS
 */
const ripsController = {
  /**
   * Genera archivos RIPS según la resolución 3374
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  generate3374: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        entityCode,
        includeFiles = [],
      } = req.body;

      // Validar datos de entrada
      if (!startDate || !endDate || !entityCode) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos. Se requiere fecha inicial, fecha final y entidad.'
        });
      }

      // Obtener datos de facturación para el período
      const invoices = await Invoice.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        entityCode
      }).populate('services patients');

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron facturas para el período y entidad especificados.'
        });
      }

      // Obtener entidad
      const entity = await Entity.findOne({ code: entityCode });
      
      if (!entity) {
        return res.status(404).json({
          success: false,
          message: 'Entidad no encontrada.'
        });
      }

      // Generar archivos RIPS
      const generationId = uuidv4();
      const outputDir = path.join(__dirname, '../output/rips', generationId);
      
      // Crear directorio si no existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Mapear datos para el formato RIPS 3374
      const ripsData = await rips3374Service.mapDataToRipsFormat(invoices, entity);
      
      // Generar archivos según los tipos seleccionados
      const generatedFiles = [];
      
      // Siempre incluir archivos obligatorios (AF, US)
      const requiredFiles = ['AF', 'US'];
      const filesToGenerate = [...new Set([...requiredFiles, ...includeFiles])];
      
      for (const fileType of filesToGenerate) {
        if (ripsData[fileType] && ripsData[fileType].length > 0) {
          const filePath = path.join(outputDir, `${fileType}.txt`);
          const fileContent = rips3374Service.generateRipsFile(fileType, ripsData[fileType]);
          fs.writeFileSync(filePath, fileContent);
          
          generatedFiles.push({
            code: fileType,
            name: rips3374Service.getFileTypeName(fileType),
            path: filePath,
            records: ripsData[fileType].length
          });
        }
      }
      
      // Guardar registro de generación en la base de datos
      const ripsGeneration = new RipsGeneration({
        id: generationId,
        startDate,
        endDate,
        entityCode,
        entityName: entity.name,
        resolution: '3374',
        files: generatedFiles.map(file => ({
          code: file.code,
          name: file.name,
          records: file.records
        })),
        status: 'completed',
        createdBy: req.user ? req.user.id : null,
        generationDate: new Date()
      });
      
      await ripsGeneration.save();
      
      // Devolver respuesta
      return res.status(200).json({
        success: true,
        message: 'Archivos RIPS generados correctamente.',
        id: generationId,
        files: generatedFiles.map(file => ({
          code: file.code,
          name: file.name,
          records: file.records
        })),
        downloadUrl: `/api/rips/download/${generationId}`
      });
      
    } catch (error) {
      console.error('Error al generar RIPS 3374:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar archivos RIPS 3374.',
        error: error.message
      });
    }
  },

  /**
   * Genera archivos RIPS según la resolución 2275
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  generate2275: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        entityCode,
        includeFiles = [],
      } = req.body;

      // Validar datos de entrada
      if (!startDate || !endDate || !entityCode) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos. Se requiere fecha inicial, fecha final y entidad.'
        });
      }

      // Obtener datos de facturación para el período
      const invoices = await Invoice.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        entityCode
      }).populate('services patients');

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron facturas para el período y entidad especificados.'
        });
      }

      // Obtener entidad
      const entity = await Entity.findOne({ code: entityCode });
      
      if (!entity) {
        return res.status(404).json({
          success: false,
          message: 'Entidad no encontrada.'
        });
      }

      // Generar archivos RIPS
      const generationId = uuidv4();
      const outputDir = path.join(__dirname, '../output/rips', generationId);
      
      // Crear directorio si no existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Mapear datos para el formato RIPS 2275
      const ripsData = await rips2275Service.mapDataToRipsFormat(invoices, entity);
      
      // Generar archivos según los tipos seleccionados
      const generatedFiles = [];
      
      // Siempre incluir archivos obligatorios (AFCT, ATUS)
      const requiredFiles = ['AFCT', 'ATUS'];
      const filesToGenerate = [...new Set([...requiredFiles, ...includeFiles])];
      
      for (const fileType of filesToGenerate) {
        if (ripsData[fileType] && ripsData[fileType].length > 0) {
          const filePath = path.join(outputDir, `${fileType}.txt`);
          const fileContent = rips2275Service.generateRipsFile(fileType, ripsData[fileType]);
          fs.writeFileSync(filePath, fileContent);
          
          generatedFiles.push({
            code: fileType,
            name: rips2275Service.getFileTypeName(fileType),
            path: filePath,
            records: ripsData[fileType].length
          });
        }
      }
      
      // También generar archivos en otros formatos si se solicita
      const xmlPath = path.join(outputDir, 'rips.xml');
      const xmlContent = rips2275Service.generateXmlFiles(ripsData);
      fs.writeFileSync(xmlPath, xmlContent);
      
      // Guardar registro de generación en la base de datos
      const ripsGeneration = new RipsGeneration({
        id: generationId,
        startDate,
        endDate,
        entityCode,
        entityName: entity.name,
        resolution: '2275',
        files: generatedFiles.map(file => ({
          code: file.code,
          name: file.name,
          records: file.records
        })),
        status: 'completed',
        createdBy: req.user ? req.user.id : null,
        generationDate: new Date()
      });
      
      await ripsGeneration.save();
      
      // Devolver respuesta
      return res.status(200).json({
        success: true,
        message: 'Archivos RIPS generados correctamente.',
        id: generationId,
        files: generatedFiles.map(file => ({
          code: file.code,
          name: file.name,
          records: file.records
        })),
        downloadUrl: `/api/rips/download/${generationId}`
      });
      
    } catch (error) {
      console.error('Error al generar RIPS 2275:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar archivos RIPS 2275.',
        error: error.message
      });
    }
  },

  /**
   * Validar datos para RIPS 3374
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  validate3374: async (req, res) => {
    try {
      const data = req.body;
      
      // Realizar validaciones según reglas de la resolución 3374
      const validationResults = await rips3374Service.validateData(data);
      
      return res.status(200).json({
        success: true,
        isValid: validationResults.isValid,
        errors: validationResults.errors || [],
        warnings: validationResults.warnings || []
      });
      
    } catch (error) {
      console.error('Error al validar datos RIPS 3374:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al validar datos para RIPS 3374.',
        error: error.message
      });
    }
  },

  /**
   * Validar datos para RIPS 2275
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  validate2275: async (req, res) => {
    try {
      const data = req.body;
      
      // Realizar validaciones según reglas de la resolución 2275
      const validationResults = await rips2275Service.validateData(data);
      
      return res.status(200).json({
        success: true,
        isValid: validationResults.isValid,
        errors: validationResults.errors || [],
        warnings: validationResults.warnings || []
      });
      
    } catch (error) {
      console.error('Error al validar datos RIPS 2275:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al validar datos para RIPS 2275.',
        error: error.message
      });
    }
  },

  /**
   * Obtiene historial de generación de RIPS
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  getHistory: async (req, res) => {
    try {
      const { limit = 50, offset = 0, search, resolution } = req.query;
      
      // Construir filtro
      const filter = {};
      
      if (resolution) {
        filter.resolution = resolution;
      }
      
      if (search) {
        filter.$or = [
          { entityName: { $regex: search, $options: 'i' } },
          { entityCode: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Obtener registros
      const history = await RipsGeneration.find(filter)
        .sort({ generationDate: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));
      
      // Obtener total
      const total = await RipsGeneration.countDocuments(filter);
      
      return res.status(200).json({
        success: true,
        data: history,
        total,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });
      
    } catch (error) {
      console.error('Error al obtener historial de RIPS:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener historial de generación de RIPS.',
        error: error.message
      });
    }
  },

  /**
   * Descargar archivos RIPS generados
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  downloadRips: async (req, res) => {
    try {
      const { id } = req.params;
      const { format = 'TXT' } = req.query;
      
      // Verificar que existe el registro
      const ripsGeneration = await RipsGeneration.findOne({ id });
      
      if (!ripsGeneration) {
        return res.status(404).json({
          success: false,
          message: 'Generación de RIPS no encontrada.'
        });
      }
      
      // Directorio donde están los archivos
      const ripsDir = path.join(__dirname, '../output/rips', id);
      
      // Verificar que existe el directorio
      if (!fs.existsSync(ripsDir)) {
        return res.status(404).json({
          success: false,
          message: 'Archivos RIPS no encontrados.'
        });
      }
      
      // Preparar archivo comprimido según formato solicitado
      let outputFile;
      
      if (format === 'XML' && ripsGeneration.resolution === '2275') {
        // Devolver XML directamente
        const xmlPath = path.join(ripsDir, 'rips.xml');
        
        if (!fs.existsSync(xmlPath)) {
          return res.status(404).json({
            success: false,
            message: 'Archivo XML no encontrado.'
          });
        }
        
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader(
          'Content-Disposition', 
          `attachment; filename="rips_${ripsGeneration.entityCode}_${moment(ripsGeneration.generationDate).format('YYYYMMDD')}.xml"`
        );
        
        return fs.createReadStream(xmlPath).pipe(res);
      } else if (format === 'CSV') {
        // Generar CSV
        outputFile = await fileExportService.generateRipsCSV(ripsDir, ripsGeneration);
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
          'Content-Disposition', 
          `attachment; filename="rips_${ripsGeneration.entityCode}_${moment(ripsGeneration.generationDate).format('YYYYMMDD')}_csv.zip"`
        );
      } else {
        // Generar ZIP con archivos TXT (formato predeterminado)
        outputFile = await fileExportService.generateRipsZip(ripsDir, ripsGeneration);
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
          'Content-Disposition', 
          `attachment; filename="rips_${ripsGeneration.entityCode}_${moment(ripsGeneration.generationDate).format('YYYYMMDD')}.zip"`
        );
      }
      
      return fs.createReadStream(outputFile).pipe(res);
      
    } catch (error) {
      console.error('Error al descargar archivos RIPS:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al descargar archivos RIPS.',
        error: error.message
      });
    }
  },

  /**
   * Obtener estructura de archivos RIPS
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  getStructure: async (req, res) => {
    try {
      const { resolution } = req.params;
      
      let structure;
      
      if (resolution === '3374') {
        structure = rips3374Service.getStructure();
      } else if (resolution === '2275') {
        structure = rips2275Service.getStructure();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Resolución no válida. Utilice 3374 o 2275.'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: structure
      });
      
    } catch (error) {
      console.error('Error al obtener estructura RIPS:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estructura de archivos RIPS.',
        error: error.message
      });
    }
  },

  /**
   * Exportar RIPS en formato específico
   * @param {Request} req - Objeto de solicitud
   * @param {Response} res - Objeto de respuesta
   */
  exportRips: async (req, res) => {
    try {
      const { id } = req.params;
      const { format = 'TXT' } = req.query;
      
      // Verificar que existe el registro
      const ripsGeneration = await RipsGeneration.findOne({ id });
      
      if (!ripsGeneration) {
        return res.status(404).json({
          success: false,
          message: 'Generación de RIPS no encontrada.'
        });
      }
      
      // Generar URL de descarga
      const downloadUrl = `/api/rips/download/${id}?format=${format}`;
      
      return res.status(200).json({
        success: true,
        message: `Exportación de RIPS en formato ${format} disponible.`,
        downloadUrl
      });
      
    } catch (error) {
      console.error('Error al exportar RIPS:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al exportar RIPS.',
        error: error.message
      });
    }
  }
};

module.exports = ripsController;