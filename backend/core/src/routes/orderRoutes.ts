import express from 'express';
import {
    placeOrder,
    getAllOrders,
    getOrders,
    getTrades
} from '../controllers/orderControllers';
import { authenticateJWT } from '../middleware/authMiddlewear';

const router = express.Router();

router.post('/order', authenticateJWT, placeOrder);
router.get('/getOrders', authenticateJWT, getOrders);
router.get('/getAllOrders', authenticateJWT, getAllOrders);
router.get('/trades', authenticateJWT, getTrades);

export default router;
