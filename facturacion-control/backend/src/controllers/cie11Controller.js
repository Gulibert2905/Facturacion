const CIE11 = require('../models/CIE11');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Buscar diagnósticos para autocompletado
const searchDiagnoses = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const diagnoses = await CIE11.searchForAutocomplete(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: diagnoses,
      count: diagnoses.length
    });

  } catch (error) {
    console.error('Error searching diagnoses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar diagnósticos',
      error: error.message
    });
  }
};

// Validar un código CIE-11 específico
const validateDiagnosis = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código de diagnóstico requerido'
      });
    }

    const validation = await CIE11.validateCode(code);
    
    res.json({
      success: true,
      isValid: validation.isValid,
      diagnosis: validation.diagnosis,
      message: validation.isValid 
        ? 'Código de diagnóstico válido' 
        : 'Código de diagnóstico no válido o no activo'
    });

  } catch (error) {
    console.error('Error validating diagnosis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar diagnóstico',
      error: error.message
    });
  }
};

// Obtener diagnósticos por capítulo
const getDiagnosesByChapter = async (req, res) => {
  try {
    const { chapter } = req.params;
    const { limit = 50 } = req.query;
    
    const diagnoses = await CIE11.getByChapter(chapter, parseInt(limit));
    
    res.json({
      success: true,
      data: diagnoses,
      count: diagnoses.length,
      chapter: chapter
    });

  } catch (error) {
    console.error('Error getting diagnoses by chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener diagnósticos por capítulo',
      error: error.message
    });
  }
};

// Obtener todos los capítulos disponibles
const getChapters = async (req, res) => {
  try {
    const chapters = await CIE11.distinct('chapter', { active: true });
    
    res.json({
      success: true,
      data: chapters.sort(),
      count: chapters.length
    });

  } catch (error) {
    console.error('Error getting chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener capítulos',
      error: error.message
    });
  }
};

// Crear un nuevo diagnóstico (solo para admin)
const createDiagnosis = async (req, res) => {
  try {
    const {
      code,
      description,
      chapter,
      subcategory,
      billable = true,
      gender = 'U',
      minAge = 0,
      maxAge,
      notes
    } = req.body;

    // Verificar si ya existe
    const existing = await CIE11.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un diagnóstico con este código'
      });
    }

    const diagnosis = new CIE11({
      code: code.toUpperCase(),
      description,
      chapter,
      subcategory,
      billable,
      gender,
      minAge,
      maxAge,
      notes,
      createdBy: req.user._id
    });

    await diagnosis.save();

    res.status(201).json({
      success: true,
      data: diagnosis,
      message: 'Diagnóstico creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating diagnosis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear diagnóstico',
      error: error.message
    });
  }
};

// Actualizar un diagnóstico
const updateDiagnosis = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedBy: req.user._id };
    
    const diagnosis = await CIE11.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: 'Diagnóstico no encontrado'
      });
    }

    res.json({
      success: true,
      data: diagnosis,
      message: 'Diagnóstico actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating diagnosis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar diagnóstico',
      error: error.message
    });
  }
};

// Eliminar (desactivar) un diagnóstico
const deleteDiagnosis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const diagnosis = await CIE11.findByIdAndUpdate(
      id,
      { active: false, updatedBy: req.user._id },
      { new: true }
    );

    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: 'Diagnóstico no encontrado'
      });
    }

    res.json({
      success: true,
      data: diagnosis,
      message: 'Diagnóstico desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting diagnosis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar diagnóstico',
      error: error.message
    });
  }
};

// Importar diagnósticos masivamente desde Excel
const importDiagnoses = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Archivo requerido'
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: [],
      duplicates: [],
      errors: []
    };

    for (const row of data) {
      try {
        // Verificar campos requeridos
        if (!row.code || !row.description || !row.chapter) {
          results.errors.push({
            data: row,
            error: 'Campos requeridos: code, description, chapter'
          });
          continue;
        }

        // Verificar duplicados
        const existing = await CIE11.findOne({ 
          code: row.code.toString().toUpperCase() 
        });

        if (existing) {
          results.duplicates.push({
            data: row,
            message: `Código ${row.code} ya existe`
          });
          continue;
        }

        // Crear diagnóstico
        const diagnosis = new CIE11({
          code: row.code.toString().toUpperCase(),
          description: row.description,
          chapter: row.chapter,
          subcategory: row.subcategory || null,
          billable: row.billable !== false,
          gender: row.gender || 'U',
          minAge: parseInt(row.minAge) || 0,
          maxAge: row.maxAge ? parseInt(row.maxAge) : null,
          notes: row.notes || null,
          createdBy: req.user._id
        });

        await diagnosis.save();
        results.success.push({
          data: row,
          id: diagnosis._id,
          code: diagnosis.code
        });

      } catch (error) {
        results.errors.push({
          data: row,
          error: error.message
        });
      }
    }

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} diagnósticos importados.`);
    }
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} códigos ya existían.`);
    }
    if (results.errors.length > 0) {
      message.push(`${results.errors.length} errores encontrados.`);
    }

    res.json({
      success: true,
      message: message.join(' '),
      details: results
    });

  } catch (error) {
    console.error('Error importing diagnoses:', error);
    
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error al importar diagnósticos',
      error: error.message
    });
  }
};

module.exports = {
  searchDiagnoses,
  validateDiagnosis,
  getDiagnosesByChapter,
  getChapters,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  importDiagnoses
};