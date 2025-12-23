import { Router } from 'express';
import Ticket from '../models/Ticket';
import Product from '../models/Product';

const router = Router();

// GUARDAR VENTA (CREAR TICKET) Y DESCONTAR STOCK
router.post('/', async (req, res) => {
  try {
    const folio = `T-${Date.now().toString().slice(-6)}`;
    
    // Crear el objeto Ticket con estado activo por defecto
    const newTicket = new Ticket({ 
        ...req.body, 
        folio,
        status: 'active' 
    });
    
    await newTicket.save();

    // DESCONTAR STOCK DE LOS PRODUCTOS VENDIDOS
    if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
            // Solo descontamos si tenemos el ID del producto
            if (item.productId) {
                await Product.findByIdAndUpdate(
                    item.productId, 
                    { $inc: { stock: -item.qty } } // Restamos la cantidad vendida
                );
            }
        }
    }

    res.status(201).json(newTicket);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error al crear el ticket." });
  }
});

// OBTENER HISTORIAL DE VENTAS
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 }); // Más recientes primero
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CANCELAR TICKET Y DEVOLVER STOCK
router.put('/:id/cancel', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }

        if (ticket.status === 'cancelled') {
            return res.status(400).json({ message: 'El ticket ya está cancelado' });
        }

        // 1. Devolver artículos al stock
        if (ticket.items && Array.isArray(ticket.items)) {
            for (const item of ticket.items) {
                if (item.productId) {
                    await Product.findByIdAndUpdate(
                        item.productId, 
                        { $inc: { stock: item.qty } } // Sumamos la cantidad de vuelta
                    );
                }
            }
        }

        // 2. Marcar ticket como cancelado
        ticket.status = 'cancelled';
        await ticket.save();

        res.json({ message: 'Ticket cancelado y stock devuelto', ticket });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;