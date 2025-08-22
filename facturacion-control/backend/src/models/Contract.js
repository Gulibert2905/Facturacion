const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
 code: String,
 name: String,
 company: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'Company'
 },
 type: {
   type: String,
   enum: ['LABORATORIO', 'ODONTOLOGIA', 'MEDICINA', ,'OTROS']
 },
 validFrom: Date,
 validTo: Date,
 status: {
   type: String,
   enum: ['active', 'inactive'],
   default: 'active'
 }
});

module.exports = mongoose.model('Contract', contractSchema);