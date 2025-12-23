import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  model: { type: String, required: true, index: true },
  brand: { type: String, required: true },
  type: { type: String, required: true },
  color: { type: String, required: true },
  year: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['Fundas', 'Cargadores', 'Cables', 'Accesorios', 'Telefonia', 'Computo'],
    required: true 
  },
  stock: { type: Number, required: true, default: 0, min: 0 },
  price: { type: Number, required: true },
  image: { type: String },
  // NUEVO CAMPO: QR Code (Opcional)
  qrCode: { type: String, default: '', index: true } // Indexado para búsquedas rápidas
}, { timestamps: true });

export default mongoose.model('Product', productSchema);