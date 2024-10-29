import express from 'express';
import {
    loginUser,
    registerUser,
    addBalance,
    getUser,
    getAllUsers
} from '../controllers/userControllers';
import { authenticateJWT } from '../middleware/authMiddlewear';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);          
router.post('/addBalance', authenticateJWT, addBalance); 
router.get('/getUser', authenticateJWT, getUser); 
router.get('/getUsers', authenticateJWT, getAllUsers); 

export default router;
