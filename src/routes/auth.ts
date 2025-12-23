import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_omicron';

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

    // ACTUALIZAR ESTADO A ONLINE
    user.isOnline = true;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// LOGOUT (Opcional, para marcar offline explícitamente)
router.post('/logout', async (req, res) => {
    try {
        const { username } = req.body;
        await User.findOneAndUpdate({ username }, { isOnline: false });
        res.json({ message: 'Sesión cerrada' });
    } catch (e) { res.status(500).json({ message: 'Error al salir' }); }
});

export default router;