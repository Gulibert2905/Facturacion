// src/controllers/reportController.js - versión mejorada

const ServiceRecord = require('../models/ServiceRecord');
const Patient = require('../models/Patient');
const PreBill = require('../models/PreBill');
const ExcelJS = require('exceljs');

const generateReport = async (req, res) => {
  try {
    const { filters, columns } = req.body;
    console.log('Filtros recibidos:', filters);
    
    let query = {};
    
    // Filtros de fecha
    if (filters.startDate && filters.endDate) {
      query.serviceDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    // Filtro de empresas - Manejo del caso "all" o array vacío como "todos"
    if (filters.companies && filters.companies.length > 0 && !filters.companies.includes('all')) {
      query.companyId = { 
        $in: filters.companies
      };
    }

    // Filtro de contratos - Manejo del caso array vacío como "todos"
    if (filters.contracts && filters.contracts.length > 0) {
      query.contractId = { $in: filters.contracts };
    }

    // Filtros adicionales si los proporcionas
    if (filters.municipalities && filters.municipalities.length > 0) {
      query['patientId.municipality'] = { $in: filters.municipalities };
    }

    if (filters.regimens && filters.regimens.length > 0) {
      query['patientId.regimen'] = { $in: filters.regimens };
    }

    console.log('Query construida:', JSON.stringify(query, null, 2));

    const data = await ServiceRecord.find(query)
      .populate('patientId')
      .populate('companyId')
      .populate('contractId')
      .lean();

    console.log(`Registros encontrados: ${data.length}`);

    const formattedData = data.map(record => {
      const row = {};
      columns.forEach(col => {
        switch(col) {
          case 'documentNumber':
            row[col] = record.patientId?.documentNumber || record.documentNumber || '';
            break;
          case 'fullName':
            row[col] = record.patientId?.fullName || '';
            break;
          case 'serviceDate':
            row[col] = record.serviceDate ? 
              new Date(record.serviceDate).toLocaleDateString() : '';
            break;
          case 'cupsCode':
            row[col] = record.cupsCode || '';
            break;
          case 'value':
            row[col] = record.value || 0;
            break;
          case 'authorization':
            row[col] = record.authorization || '';
            break;
          case 'diagnosis':
            row[col] = record.diagnosis || '';
            break;
          case 'regimen':
            row[col] = record.patientId?.regimen || '';
            break;
          case 'municipality':
            row[col] = record.patientId?.municipality || '';
            break;
          case 'department':
            row[col] = record.patientId?.department || '';
            break;
          case 'companyName':
            row[col] = record.companyId?.name || '';
            break;
          case 'contractName':
            row[col] = record.contractId?.name || '';
            break;
          default:
            row[col] = record[col] || '';
        }
      });
      return row;
    });

    // Calcular totales
    const totals = {
      totalServices: formattedData.length,
      totalValue: formattedData.reduce((sum, row) => sum + (row.value || 0), 0),
      servicesByRegimen: formattedData.reduce((acc, row) => {
        const regimen = row.regimen || 'No especificado';
        acc[regimen] = (acc[regimen] || 0) + 1;
        return acc;
      }, {}),
      valueByCompany: formattedData.reduce((acc, row) => {
        const company = row.companyName || 'No especificado';
        acc[company] = (acc[company] || 0) + (row.value || 0);
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: formattedData,
      totals,
      metadata: {
        query: query,
        recordsFound: data.length,
        appliedFilters: filters
      }
    });

  } catch (error) {
    console.error('Error en generateReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};

const exportReport = async (req, res) => {
  try {
    const { filters, columns, data } = req.body;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Definir columnas
    worksheet.columns = columns.map(col => ({
      header: getColumnLabel(col.id || col),
      key: col.id || col,
      width: 15
    }));

    // Estilo para encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Agregar datos
    data.forEach(row => {
      // Formatear valores de fechas para Excel si existen
      const formattedRow = {...row};
      Object.keys(formattedRow).forEach(key => {
        if (key.toLowerCase().includes('date') && formattedRow[key]) {
          try {
            // Intentar convertir strings de fecha a objetos Date para Excel
            if (typeof formattedRow[key] === 'string' && formattedRow[key].includes('-')) {
              formattedRow[key] = new Date(formattedRow[key]);
            }
          } catch(e) {
            console.warn(`Error al convertir fecha ${key}: ${formattedRow[key]}`);
          }
        }
      });
      
      worksheet.addRow(formattedRow);
    });
    
    // Ajustar anchos de columnas automáticamente
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? String(cell.value).length : 10;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(maxLength + 2, 30);
    });

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error exportando reporte:', error);
    res.status(500).json({ message: error.message });
  }
};

// Función helper para obtener etiquetas de columnas
const getColumnLabel = (columnId) => {
  const labels = {
    documentNumber: 'Documento',
    fullName: 'Nombre',
    serviceDate: 'Fecha Servicio',
    cupsCode: 'CUPS',
    value: 'Valor',
    authorization: 'Autorización',
    diagnosis: 'Diagnóstico',
    regimen: 'Régimen',
    municipality: 'Municipio',
    department: 'Departamento',
    companyName: 'Empresa',
    contractName: 'Contrato'
  };
  return labels[columnId] || columnId;
};

const getMunicipalities = async (req, res) => {
  try {
    const municipalities = await Patient.distinct('municipality', { 
      municipality: { $ne: null, $ne: '' } 
    });
    res.json(municipalities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Patient.distinct('department', {
      department: { $ne: null, $ne: '' }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRegimens = async (req, res) => {
  try {
    const regimens = await Patient.distinct('regimen', {
      regimen: { $ne: null, $ne: '' }
    });
    res.json(regimens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateReport,
  exportReport,
  getMunicipalities,
  getDepartments,
  getRegimens
};