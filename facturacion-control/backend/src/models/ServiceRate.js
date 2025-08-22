const serviceRateSchema = new mongoose.Schema({
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract'
    },
    value: Number,
    requiresAuthorization: {
      type: Boolean,
      default: false
    },
    validFrom: Date,
    validTo: Date
  });