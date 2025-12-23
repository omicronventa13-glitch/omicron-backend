import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super', 'admin', 'vendedor'], default: 'vendedor' },
  isOnline: { type: Boolean, default: false }, // NUEVO CAMPO
  lastLogin: { type: Date }
});

export default mongoose.model('User', userSchema);