const Company = require('../models/Company');
const Contract = require('../models/Contract');

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCompanyContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ 
      company: req.params.companyId,
      status: 'active'
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCompanies, getCompanyContracts };