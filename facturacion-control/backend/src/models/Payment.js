// /src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity'
  },
  entityName: String,
  paymentDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['transfer', 'check', 'cash', 'other'],
    default: 'transfer'
  },
  reference: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'completed'
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;