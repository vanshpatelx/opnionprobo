import { z } from 'zod';
import { Request, Response } from 'express';
import { channel } from '../config/rabbitMQPublisher';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../config/redisCache';
import { handleError } from '../utils/errorHandler';

const orderSchema = z.object({
    eventId: z.string(),
    side: z.enum(['yes', 'no']).optional(),
    type: z.enum(['buy', 'sell']).optional(),
    qty: z.number(),
    price: z.number(),
    filledQuantity: z.number(),
    status: z.enum(['Not Executed', 'Partial', 'Done'])
});

const placeOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = orderSchema.parse(req.body);
        const { eventId, side, type, qty, price, filledQuantity, status } = parsedData;

        if (!req.user || req.user.role !== 'user') {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const id = uuidv4();
        const orderData = { id, eventId, side, type, qty, price, filledQuantity, status, userId: req.user.id };

        channel.sendToQueue('orderQueue', Buffer.from(JSON.stringify(orderData)));

        await redisClient.set(`order:${req.user.id}:${eventId}:${id}`, JSON.stringify(orderData), { EX: 86400 });

        res.status(201).json({ message: 'Order placed successfully', orderId: id });

    } catch (error) {
        handleError(res, error, 'Error fetching all events');
    }
};

const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'user' || !req.user.id) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const keys = await redisClient.keys(`order:${req.user.id}:*`); 
        const orders = await Promise.all(keys.map(key => redisClient.get(key)));

        const parsedOrders = orders.map(order => order ? JSON.parse(order) : null).filter(order => order !== null);

        res.status(200).json(parsedOrders);

    } catch (error) {
        handleError(res, error, 'Error fetching all events');
    }
};

const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'admin' || !req.user.id) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const keys = await redisClient.keys(`order:${req.user.id}:*`); 
        const orders = await Promise.all(keys.map(key => redisClient.get(key)));

        const parsedOrders = orders.map(order => order ? JSON.parse(order) : null).filter(order => order !== null);

        res.status(200).json(parsedOrders);

    } catch (error) {
        handleError(res, error, 'Error fetching all events');
    }
};

// left some works
const getTrades = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'admin' || !req.user.id) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const keys = await redisClient.keys(`order:${req.user.id}:*`); 
        const orders = await Promise.all(keys.map(key => redisClient.get(key)));

        const parsedOrders = orders.map(order => order ? JSON.parse(order) : null).filter(order => order !== null);

        res.status(200).json(parsedOrders);

    } catch (error) {
        handleError(res, error, 'Error fetching all events');
    }
};
export { placeOrder, getAllOrders, getOrders, getTrades };