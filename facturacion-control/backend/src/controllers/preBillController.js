const PreBill = require('../models/PreBill');
const ExcelJS = require('exceljs');
const Patient = require('../models/Patient');

const createPreBill = async (req, res) => {
  try {
    const { patientId, services, authorization, diagnosis, ...rest } = req.body;
    
    // Obtener datos completos del paciente
    const patient = await Patient.findById(patientId);
    
    const preBillData = {
      ...rest,
      patientId,
      patientData: {
        documentNumber: patient.documentNumber,
        documentType: patient.documentType,
        firstName: patient.firstName,
        secondName: patient.secondName,
        firstLastName: patient.firstLastName,
        secondLastName: patient.secondLastName,
        birthDate: patient.birthDate,
        gender: patient.gender,
        eps: patient.eps,
        department: patient.department,
        municipality: patient.municipality,
        zone: patient.zone || 'U'
      },
      services: services.map(service => ({
        ...service,
        authorization,
        diagnosis
      }))
    };

    const preBill = await PreBill.create(preBillData);
    res.status(201).json(preBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// controllers/preBillController.js
const getPreBillHistory = async (req, res) => {
  try {
    const { startDate, endDate, company, contract, status } = req.query;
    
    // Construir filtros
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (company) query.companyId = company;
    if (contract) query.contractId = contract;
    if (status) query.status = status;

    // Obtener prefacturas con populate
    const preBills = await PreBill.find(query)
      .populate('companyId', 'name')
      .populate('contractId', 'name')
      .populate('patientId', 'fullName documentNumber')
      .sort({ createdAt: -1 });

    res.json(preBills);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reimprimir una prefactura específica
const reprintPreBill = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Reprint request for prebill: ${id}`);
    
    const preBill = await PreBill.findById(id)
      .populate('companyId')
      .populate('contractId')
      .populate('patientId');

    if (!preBill) {
      console.log(`[DEBUG] Prebill not found for reprint: ${id}`);
      return res.status(404).json({ message: 'Prefactura no encontrada' });
    }

    console.log(`[DEBUG] Generating Excel for prebill: ${id} with ${preBill.services.length} services`);
    
    // Generate Excel for a single prebill as before
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prefactura');
    
    // Define columns
    worksheet.columns = [
      { header: 'N DOCUMENTO', key: 'documentNumber', width: 15 },
      { header: 'TIPDOC', key: 'documentType', width: 10 },
      { header: 'TOTAL', key: 'totalValue', width: 12 },
      { header: 'FECHA_SERV', key: 'serviceDate', width: 12 },
      { header: 'AUTORIZACION', key: 'authorization', width: 15 },
      { header: 'DX', key: 'diagnosis', width: 10 },
      { header: 'CUPS', key: 'cupsCode', width: 10 }
    ];

    // Add data
    if (preBill.services && preBill.services.length > 0) {
      preBill.services.forEach(service => {
        const patientDocNumber = preBill.patientId?.documentNumber || 
                                preBill.patientData?.documentNumber || 
                                '';
        const patientDocType = preBill.patientId?.documentType || 
                              preBill.patientData?.documentType || 
                              '';
        
        worksheet.addRow({
          documentNumber: patientDocNumber,
          documentType: patientDocType,
          totalValue: service.value || 0,
          serviceDate: service.serviceDate ? new Date(service.serviceDate).toISOString().split('T')[0] : '',
          authorization: service.authorization || preBill.authorization || '',
          diagnosis: service.diagnosis || preBill.diagnosis || '',
          cupsCode: service.cupsCode || ''
        });
      });
    } else {
      console.log(`[WARNING] No services found for prebill: ${id}`);
    }

    // Style the sheet
    worksheet.getRow(1).font = { bold: true };
    
    console.log(`[DEBUG] Excel generated successfully, sending response`);
    
    // Generate and send file
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=prefactura_${id}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error in reprintPreBill:', error);
    res.status(500).json({ message: `Error al reimprimir prefactura: ${error.message}` });
  }
};

const exportPreBills = async (req, res) => {
  try {
    // Obtener las prefacturas con toda la información necesaria
    const preBills = await PreBill.find({ status: 'parcial' })
      .populate('patientId')
      .populate('companyId')
      .populate('contractId');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prefacturación');

    // Definir las columnas según tu estructura requerida
    worksheet.columns = [
      { header: 'N DOCUMENTO', key: 'documentNumber', width: 15 },
      { header: 'TIPDOC', key: 'documentType', width: 10 },
      { header: 'PRINOM', key: 'firstName', width: 15 },
      { header: 'SEGNOM', key: 'secondName', width: 15 },
      { header: 'PRIAPE', key: 'firstLastName', width: 15 },
      { header: 'SEGAPE', key: 'secondLastName', width: 15 },
      { header: 'FECNAC', key: 'birthDate', width: 12 },
      { header: 'SEXO', key: 'gender', width: 8 },
      { header: 'EPS', key: 'eps', width: 15 },
      { header: 'DPTO', key: 'department', width: 15 },
      { header: 'MIPIO', key: 'municipality', width: 15 },
      { header: 'ZONA', key: 'zone', width: 10 },
      { header: 'TOTAL', key: 'totalValue', width: 12 },
      { header: 'FECHA_SERV', key: 'serviceDate', width: 12 },
      { header: 'AUTORIZACION', key: 'authorization', width: 15 },
      { header: 'DX', key: 'diagnosis', width: 10 },
      { header: 'CUPS', key: 'cupsCode', width: 10 },
      { header: 'EMPRESA', key: 'company', width: 20 },
      { header: 'CONTRATO', key: 'contract', width: 20 }
    ];

    // Agregar los datos
    preBills.forEach(bill => {
      bill.services.forEach(service => {
        worksheet.addRow({
          documentNumber: bill.patientId.documentNumber,
          documentType: bill.patientId.documentType,
          firstName: bill.patientId.firstName,
          secondName: bill.patientId.secondName,
          firstLastName: bill.patientId.firstLastName,
          secondLastName: bill.patientId.secondLastName,
          birthDate: bill.patientId.birthDate?.toISOString().split('T')[0],
          gender: bill.patientId.gender,
          eps: bill.patientId.eps,
          department: bill.patientId.department,
          municipality: bill.patientId.municipality,
          zone: bill.patientId.zone || 'U',
          totalValue: service.value,
          serviceDate: service.serviceDate?.toISOString().split('T')[0],
          authorization: service.authorization,
          diagnosis: service.diagnosis,
          cupsCode: service.cupsCode,
          company: bill.companyId.name,
          contract: bill.contractId.name
        });
      });
    });

    // Aplicar estilos
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Actualizar estado de las prefacturas
    await PreBill.updateMany(
      { _id: { $in: preBills.map(b => b._id) } },
      { status: 'finalizada' }
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=prefacturacion_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    res.send(buffer);

  } catch (error) {
    console.error('Error exportando prefacturas:', error);
    res.status(500).json({ message: 'Error al exportar prefacturas' });
  }
};



module.exports = { createPreBill, exportPreBills,getPreBillHistory,
  reprintPreBill };