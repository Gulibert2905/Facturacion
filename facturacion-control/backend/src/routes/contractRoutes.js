const express = require('express');
const router = express.Router();
const { getContracts } = require('../controllers/contractController');
const Contract = require('../models/Contract');

router.get('/', getContracts);

router.post('/', async (req, res) => {
    try {
      const contract = await Contract.create(req.body);
      res.status(201).json(contract);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

router.put('/:id', async (req, res) => {
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
    res.json({ message: 'Contracto eliminada' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});  
module.exports = router;