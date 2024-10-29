import { Request, Response } from 'express';
import { redisClient } from '../config/redisCache';
import { z } from 'zod';
import { channel } from '../config/rabbitMQPublisher';
import { v4 as uuidv4 } from 'uuid';
import { handleError } from '../utils/errorHandler';

const addEventSchema = z.object({
    name: z.string(),
    endTime: z.string().datetime(),
    description: z.string(),
    sourceOfTruth: z.string()
});

const addCategorySchema = z.object({
    name: z.string(),
    icons: z.string(),
    description: z.string()
});

const getAllEventsSchema = z.object({
    id: z.string()
});

const getEventSchema = z.object({
    id: z.string()
});

const mappingSchema = z.object({
    categoryId: z.string(),
    eventId: z.array(z.string())
});

const getAllEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = getAllEventsSchema.parse(req.body);
        const { id } = parsedData;

        if (!req.user || !req.user.id || !req.user.username) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const categoryData = await redisClient.get(`category:${id}`);
        if (!categoryData) {
            res.status(404).json({ message: 'Category not found.' });
            return;
        }

        res.status(200).json({ message: 'Category fetched successfully.', category: JSON.parse(categoryData) });
    } catch (error) {
        handleError(res, error, 'Error fetching all events');
    }
};

const getEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = getEventSchema.parse(req.body);
        const { id } = parsedData;

        if (!req.user || !req.user.id || !req.user.username) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const eventData = await redisClient.get(`event:${id}`);
        if (!eventData) {
            res.status(404).json({ message: 'Event not found.' });
            return;
        }

        res.status(200).json({ message: 'Event fetched successfully.', event: JSON.parse(eventData) });
    } catch (error) {
        handleError(res, error, 'Error fetching event');
    }
};

const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id || !req.user.username) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const categories = await redisClient.get(`category:*`);
        res.status(200).json({ message: 'All categories fetched successfully.', categories });
    } catch (error) {
        handleError(res, error, 'Error fetching all categories');
    }
};

const addEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = addEventSchema.parse(req.body);
        const { name, description, endTime, sourceOfTruth } = parsedData;

        if (!req.user || !req.user.id || !req.user.username || req.user.role !== 'admin') {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const id = uuidv4();
        channel.sendToQueue(
            'eventQueue',
            Buffer.from(JSON.stringify({ id, name, description, endTime, sourceOfTruth }))
        );

        await redisClient.set(
            `event:${id}`,
            JSON.stringify({ name, description, endTime, sourceOfTruth }),
            { EX: 86400 }
        );

        res.status(200).json({ message: 'Event added successfully.', id });
    } catch (error) {
        handleError(res, error, 'Error adding event');
    }
};

const addCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = addCategorySchema.parse(req.body);
        const { name, icons, description } = parsedData;

        if (!req.user || !req.user.id || !req.user.username || req.user.role !== 'admin') {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const id = uuidv4();
        channel.sendToQueue(
            'eventQueue',
            Buffer.from(JSON.stringify({ id, name, description, icons }))
        );

        await redisClient.set(
            `category:${id}`,
            JSON.stringify({ name, description, icons }),
            { EX: 86400 }
        );

        res.status(200).json({ message: 'Category added successfully.', id });
    } catch (error) {
        handleError(res, error, 'Error adding category');
    }
};

const categoryEventMapping = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = mappingSchema.parse(req.body);
        const { categoryId, eventId } = parsedData;

        if (!req.user || !req.user.id || !req.user.username || req.user.role !== 'admin') {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }

        const id = uuidv4();
        channel.sendToQueue(
            'eventQueue',
            Buffer.from(JSON.stringify({ id, categoryId, eventId }))
        );

        await redisClient.set(
            `mapping:${id}`,
            JSON.stringify({ categoryId, eventId }),
            { EX: 86400 }
        );

        res.status(200).json({ message: 'Category mapping successful.', id });
    } catch (error) {
        handleError(res, error, 'Error mapping category to event');
    }
};

export { getAllEvents, getAllCategories, getEvent, addCategory, addEvent, categoryEventMapping };
