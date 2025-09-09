const express = require('express');
const router = express.Router();
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');
const { validatePreBillDiagnoses } = require('../middleware/diagnosisValidation');
const PreBill = require('../models/PreBill');
const { 
  createPreBill, 
  exportPreBills, 
  getPreBillHistory,
  reprintPreBill 
} = require('../controllers/preBillController');

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta GET básica para listar preBills con filtros
router.get('/', requirePermission(MODULES.PREBILLS, ACTIONS.READ), async (req, res) => {
  try {
    const { status, companyId, contractId } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (companyId) query.companyId = companyId;
    if (contractId) query.contractId = contractId;
    
    const preBills = await PreBill.find(query)
      .populate('companyId', 'name')
      .populate('contractId', 'name')
      .populate('patientId', 'documentNumber')
      .sort({ updatedAt: -1 });
    
    res.json(preBills);
  } catch (error) {
    console.error('Error al obtener prefacturas:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requirePermission(MODULES.PREBILLS, ACTIONS.CREATE), validatePreBillDiagnoses, async (req, res) => {
  try {
    const { companyId, contractId, patientId, services, preBillId } = req.body;
    
    // Si viene un ID de prefactura, intentamos actualizarla
    if (preBillId) {
      const existingPreBill = await PreBill.findById(preBillId);
      
      if (existingPreBill && existingPreBill.status === 'parcial') {
        // Combinar servicios existentes con nuevos, evitando duplicados
        const existingServiceIds = existingPreBill.services.map(s => s.serviceId.toString());
        const newServices = services.filter(s => !existingServiceIds.includes(s.serviceId.toString()));
        
        existingPreBill.services = [...existingPreBill.services, ...newServices];
        existingPreBill.totalValue = existingPreBill.services.reduce((sum, s) => sum + s.value, 0);
        
        // Actualizar otros campos si se proporcionan
        if (req.body.authorization) existingPreBill.authorization = req.body.authorization;
        if (req.body.diagnosis) existingPreBill.diagnosis = req.body.diagnosis;
        
        await existingPreBill.save();
        return res.json(existingPreBill);
      }
    }
    
    // Si no hay ID o no se encontró la prefactura, crear una nueva
    const newPreBill = await PreBill.create({
      ...req.body,
      status: 'parcial' // Por defecto, la nueva prefactura queda en estado parcial
    });
    
    res.status(201).json(newPreBill);
  } catch (error) {
    console.error('Error creando prefactura:', error);
    res.status(400).json({ message: error.message });
  }
});
router.get('/export', 
  requirePermission(MODULES.PREBILLS, ACTIONS.READ), 
  exportPreBills
);

router.get('/history', 
  requirePermission(MODULES.PREBILLS, ACTIONS.READ), 
  getPreBillHistory
);

router.get('/reprint/:id', 
  requirePermission(MODULES.PREBILLS, ACTIONS.READ), 
  reprintPreBill
);

// Obtener prefacturas activas
router.get('/active', requirePermission(MODULES.PREBILLS, ACTIONS.READ), async (req, res) => {
  try {
    const { companyId, contractId } = req.query;
    const query = { status: 'parcial' };
    
    if (companyId) query.companyId = companyId;
    if (contractId) query.contractId = contractId;
    
    const preBills = await PreBill.find(query)
      .populate('companyId', 'name')
      .populate('contractId', 'name')
      .populate('patientId', 'documentNumber') // Only get document number, not full name
      .sort({ updatedAt: -1 });
    
    // Format response to exclude patient names
    const formattedPreBills = preBills.map(bill => ({
      _id: bill._id,
      companyName: bill.companyId?.name || 'Desconocida',
      contractName: bill.contractId?.name || 'Desconocido',
      patientDocument: bill.patientId?.documentNumber || '',
      // Remove patientName field entirely
      services: bill.services.length,
      totalValue: bill.totalValue || 0,
      updatedAt: bill.updatedAt
    }));
    
    res.json(formattedPreBills);
  } catch (error) {
    console.error('Error al obtener prefacturas activas:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener detalle de una prefactura
router.get('/:id', requirePermission(MODULES.PREBILLS, ACTIONS.READ), async (req, res) => {
  try {
    const preBill = await PreBill.findById(req.params.id)
      .populate('companyId', 'name')
      .populate('contractId', 'name')
      .populate('patientId');
    
    if (!preBill) {
      return res.status(404).json({ message: 'Prefactura no encontrada' });
    }
    
    res.json(preBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Finalizar una prefactura
router.patch('/:id/finalize', requirePermission(MODULES.PREBILLS, ACTIONS.UPDATE), async (req, res) => {
  try {
    console.log(`[DEBUG] Finalize request received for prebill: ${req.params.id}`);
    
    const preBill = await PreBill.findById(req.params.id);
    
    if (!preBill) {
      console.log(`[DEBUG] Prebill not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Prefactura no encontrada' });
    }
    
    console.log(`[DEBUG] Prebill current status: ${preBill.status}`);
    
    if (preBill.status === 'finalizada') {
      console.log(`[DEBUG] Prebill already finalized: ${req.params.id}`);
      return res.json({ 
        message: 'Prefactura ya estaba finalizada',
        preBill,
        alreadyFinalized: true
      });
    }
    
    // Update status
    preBill.status = 'finalizada';
    const savedPreBill = await preBill.save();
    console.log(`[DEBUG] Prebill finalized successfully with status: ${savedPreBill.status}`);
    
    res.json({ 
      message: 'Prefactura finalizada correctamente', 
      preBill: savedPreBill,
      success: true 
    });
  } catch (error) {
    console.error('Error finalizing prebill:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/export-single', requirePermission(MODULES.PREBILLS, ACTIONS.READ), async (req, res) => {
  try {
    const preBill = await PreBill.findById(req.params.id)
      .populate('companyId')
      .populate('contractId')
      .populate('patientId');
    
    if (!preBill) {
      return res.status(404).json({ message: 'Prefactura no encontrada' });
    }
    
    // Configurar headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=prefactura_${req.params.id}.xlsx`);
    
    // Crear workbook y worksheet
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prefactura');
    
    // Mismo formato que usas en reprintPreBill
    worksheet.columns = [
      { header: 'N DOCUMENTO', key: 'documentNumber', width: 15 },
      { header: 'TIPDOC', key: 'documentType', width: 10 },
      { header: 'TOTAL', key: 'totalValue', width: 12 },
      { header: 'FECHA_SERV', key: 'serviceDate', width: 12 },
      { header: 'AUTORIZACION', key: 'authorization', width: 15 },
      { header: 'DX', key: 'diagnosis', width: 10 },
      { header: 'CUPS', key: 'cupsCode', width: 10 }
    ];
    
    // Agregar datos
    preBill.services.forEach(service => {
      worksheet.addRow({
        documentNumber: preBill.patientId?.documentNumber || '',
        documentType: preBill.patientId?.documentType || '',
        totalValue: service.value,
        serviceDate: service.serviceDate instanceof Date ? 
          service.serviceDate.toISOString().split('T')[0] : 
          service.serviceDate,
        authorization: preBill.authorization || '',
        diagnosis: preBill.diagnosis || '',
        cupsCode: service.cupsCode
      });
    });
    
    // Estilo de la hoja
    worksheet.getRow(1).font = { bold: true };
    
    // Generar y enviar
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando prefactura:', error);
    res.status(500).json({ message: 'Error al exportar prefactura: ' + error.message });
  }
});

router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente', timestamp: new Date() });
});

module.exports = router;