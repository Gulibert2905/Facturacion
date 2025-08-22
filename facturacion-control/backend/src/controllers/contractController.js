const Contract = require('../models/Contract');

const getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ status: 'active' });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getContracts };