const Doctor = require('../models/Doctor');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Crear médico
const createDoctor = async (req, res) => {
  try {
    const {
      documentType,
      documentNumber,
      firstName,
      secondName,
      firstLastName,
      secondLastName,
      professionalCard,
      specialty,
      specialtyCode,
      email,
      phone
    } = req.body;

    // Verificar si ya existe
    const existingDoctor = await Doctor.findOne({
      $or: [
        { documentNumber },
        { professionalCard }
      ]
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un médico con este número de documento o tarjeta profesional'
      });
    }

    const doctor = new Doctor({
      documentType,
      documentNumber,
      firstName,
      secondName,
      firstLastName,
      secondLastName,
      professionalCard,
      specialty,
      specialtyCode,
      email,
      phone,
      empresa: req.user.empresa,
      createdBy: req.user._id
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      data: doctor,
      message: 'Médico creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear médico',
      error: error.message
    });
  }
};

// Obtener todos los médicos
const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', specialty = '' } = req.query;
    
    const filter = { 
      empresa: req.user.empresa,
      active: true 
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { firstLastName: searchRegex },
        { documentNumber: searchRegex },
        { professionalCard: searchRegex }
      ];
    }

    if (specialty) {
      filter.specialty = new RegExp(specialty, 'i');
    }

    const doctors = await Doctor.find(filter)
      .populate('createdBy', 'username')
      .sort({ firstName: 1, firstLastName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Doctor.countDocuments(filter);

    res.json({
      success: true,
      data: doctors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener médicos',
      error: error.message
    });
  }
};

// Búsqueda para autocompletado
const searchDoctors = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const doctors = await Doctor.searchForAutocomplete(q, req.user.empresa);

    res.json({
      success: true,
      data: doctors
    });

  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda de médicos',
      error: error.message
    });
  }
};

// Obtener médico por documento
const getDoctorByDocument = async (req, res) => {
  try {
    const { documentNumber } = req.params;
    
    const doctor = await Doctor.findOne({
      documentNumber,
      empresa: req.user.empresa,
      active: true
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    res.json({
      success: true,
      data: doctor
    });

  } catch (error) {
    console.error('Error getting doctor by document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar médico',
      error: error.message
    });
  }
};

// Actualizar médico
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedBy = req.user._id;

    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // Verificar duplicados si se cambia documento o tarjeta profesional
    if (updateData.documentNumber !== doctor.documentNumber || 
        updateData.professionalCard !== doctor.professionalCard) {
      const existingDoctor = await Doctor.findOne({
        _id: { $ne: id },
        $or: [
          { documentNumber: updateData.documentNumber },
          { professionalCard: updateData.professionalCard }
        ]
      });

      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un médico con este número de documento o tarjeta profesional'
        });
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedDoctor,
      message: 'Médico actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar médico',
      error: error.message
    });
  }
};

// Eliminar médico (soft delete)
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { 
        active: false,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Médico desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar médico',
      error: error.message
    });
  }
};

// Importación masiva desde Excel
const importDoctors = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo'
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      created: 0,
      errors: [],
      duplicates: 0
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validar campos requeridos
        if (!row.documentType || !row.documentNumber || !row.firstName || 
            !row.firstLastName || !row.professionalCard || !row.specialty) {
          results.errors.push({
            row: i + 2,
            error: 'Campos requeridos faltantes',
            data: row
          });
          continue;
        }

        // Verificar duplicados
        const existing = await Doctor.findOne({
          $or: [
            { documentNumber: row.documentNumber },
            { professionalCard: row.professionalCard }
          ]
        });

        if (existing) {
          results.duplicates++;
          continue;
        }

        // Crear médico
        const doctor = new Doctor({
          documentType: row.documentType,
          documentNumber: row.documentNumber,
          firstName: row.firstName,
          secondName: row.secondName || '',
          firstLastName: row.firstLastName,
          secondLastName: row.secondLastName || '',
          professionalCard: row.professionalCard,
          specialty: row.specialty,
          specialtyCode: row.specialtyCode || '',
          email: row.email || '',
          phone: row.phone || '',
          empresa: req.user.empresa,
          createdBy: req.user._id
        });

        await doctor.save();
        results.created++;

      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row
        });
      }
    }

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Importación completada. ${results.created} médicos creados, ${results.duplicates} duplicados omitidos, ${results.errors.length} errores`,
      data: results
    });

  } catch (error) {
    console.error('Error importing doctors:', error);
    
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error al importar médicos',
      error: error.message
    });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  searchDoctors,
  getDoctorByDocument,
  updateDoctor,
  deleteDoctor,
  importDoctors
};