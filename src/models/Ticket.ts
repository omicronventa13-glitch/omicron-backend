import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  folio: { type: String, unique: true, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  seller: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' }, // NUEVO CAMPO
  items: [{
    productId: { type: String }, // Importante para devolver stock
    product: { type: String, required: true },
    brand: { type: String },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }]
});

export default mongoose.model('Ticket', ticketSchema);