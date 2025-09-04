const express = require('express');
const router = express.Router();
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');
const { 
  getContractsWithCeiling,
  updateContractCeiling,
  getContractAlerts
} = require('../controllers/contractController');
const Contract = require('../models/Contract');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.READ),
  async (req, res) => {
    try {
      const contracts = await Contract.find().populate('company');
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get('/with-ceiling', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.READ),
  getContractsWithCeiling
);

router.get('/company/:companyId', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.READ),
  async (req, res) => {
    try {
      const contracts = await Contract.find({ company: req.params.companyId }).populate('company');
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get('/alerts', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.READ),
  getContractAlerts
);

router.patch('/:id/ceiling', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.UPDATE),
  updateContractCeiling
);

router.post('/', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.CREATE),
  async (req, res) => {
    try {
      const contract = await Contract.create(req.body);
      res.status(201).json(contract);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.put('/:id', 
  requirePermission(MODULES.CONTRACTS, ACTIONS.UPDATE),
  async (req, res) => {
    try {
      const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(contract);
    } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Contract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contrato eliminado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});  

module.exports = router;