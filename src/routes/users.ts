import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const router = Router();

// OBTENER TODOS (Incluye estado online)
router.get('/', async (req, res) => {
  try {
    // Devolvemos todo excepto la contraseña hash
    const users = await User.find({}, '-password'); 
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CREAR USUARIO
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Verificar si ya existe
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role, isOnline: false });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// EDITAR USUARIO (Nueva ruta necesaria para la gestión)
router.put('/:id', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const updateData: any = { username, role };

        // Solo encriptar y actualizar password si se envía uno nuevo (no vacío)
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedUser);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// ELIMINAR USUARIO
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;