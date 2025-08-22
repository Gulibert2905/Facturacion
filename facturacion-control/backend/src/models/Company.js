const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: String,
  nit: String,
  code: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  billingConfigs: {
    prefixes: [String],
    costCenter: String,
    defaultBranch: String
  }
});

module.exports = mongoose.model('Company', companySchema);