const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Company = require('../models/Company');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:companyId/contracts', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('Looking for contracts for company:', companyId); // Debug
    
    // Manejar caso especial para "all"
    if (companyId === 'all') {
      console.log('Buscando todos los contratos activos');
      const allContracts = await Contract.find({ 
        status: 'active' 
      });
      return res.json(allContracts);
    }

    // Validación normal para IDs específicos
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'ID de compañía inválido' });
    }

    const contracts = await Contract.find({
      company: companyId,
      status: 'active'
    });
        
    console.log('Contracts found:', contracts); // Debug
    res.json(contracts);
  } catch (error) {
    console.error('Error in contracts route:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Empresa eliminada' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;