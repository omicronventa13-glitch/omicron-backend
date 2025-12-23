import mongoose from 'mongoose';

const repairOrderSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  cost: { type: Number, required: true, default: 0 },
  downPayment: { type: Number, required: true, default: 0 },
  deliveryDate: { type: Date },
  comments: { type: String },
  status: { type: String, default: 'Pendiente' },
  
  // Objeto Device
  device: {
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    color: { type: String, default: '' }
  },

  // Campos de Seguridad (NUEVO)
  unlockType: { type: String, enum: ['pattern', 'password', 'none'], default: 'none' }, // pattern, password, none
  unlockCode: { type: String, default: '' }, // Guardará "1235" para patrón o "1234" para PIN

  evidencePhotos: [{ type: String }],
  clientSignature: { type: String },
  closedAt: { type: Date }

}, { 
  timestamps: true 
});

export default mongoose.model('RepairOrder', repairOrderSchema);