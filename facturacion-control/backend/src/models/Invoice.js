// /src/models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  prefix: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity'
  },
  entityName: String,
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  contractName: String,
  totalValue: {
    type: Number,
    required: true,
    default: 0
  },
  glosaValue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'draft'
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  costs: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    amount: Number,
    description: String
  }]
}, {
  timestamps: true
});

// Método estático para buscar facturas
invoiceSchema.statics.findByFilters = function(filters) {
  return this.find(filters);
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;