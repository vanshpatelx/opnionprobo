import express from 'express';
import {
    getAllEvents,
    getAllCategories,
    getEvent,
    addCategory,
    addEvent,
    categoryEventMapping
} from '../controllers/eventControllers';
import { authenticateJWT } from '../middleware/authMiddlewear';

const router = express.Router();

router.get('/events', authenticateJWT, getAllEvents);
router.get('/event/:id', authenticateJWT, getEvent);
router.get('/categories', authenticateJWT, getAllCategories);
router.post('/event', authenticateJWT, addEvent);
router.post('/category', authenticateJWT, addCategory);
router.post('/category/:event',authenticateJWT, categoryEventMapping);


export default router;
