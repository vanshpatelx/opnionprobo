import { Request, Response } from 'express';
import { redisClient } from '../config/redisCache';
import { channel } from '../config/rabbitMQPublisher';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { handleError } from '../utils/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const registerSchema = z.object({
  username: z.string().email('Invalid username/email format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['user', 'admin']).optional(),
});

const loginSchema = z.object({
  username: z.string().email('Invalid username/email format.'),
  password: z.string().min(1, 'Password is required.'),
});

const addBalanceSchema = z.object({
  balance: z.number().positive('Balance must be a positive number.'),
});

const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = registerSchema.parse(req.body);
    const { username, password, role } = parsedData;

    const existingUser = await redisClient.get(`username:${username}`);
    if (existingUser) {
      res.status(400).json({ message: 'User already registered.', username });
      return;
    }

    const userRole = role || 'user';
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    channel.sendToQueue(
      'userQueue',
      Buffer.from(JSON.stringify({ username, hashedPassword, role: userRole, id, balance: 0, locked: 0 }))
    );

    await redisClient.set(
      `username:${username}`,
      JSON.stringify({ hashedPassword, role: userRole, id, balance: 0, locked: 0 }),
      { EX: 86400 }
    );

    const token = jwt.sign({ username, id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ message: 'User registered successfully.', username, token });
  } catch (error) {
    handleError(res, error, 'Error fetching all events');
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = loginSchema.parse(req.body);
    const { username, password } = parsedData;

    const existingUser = await redisClient.get(`username:${username}`);
    if (!existingUser) {
      res.status(400).json({ message: 'Username not registered!', username });
      return;
    }

    const userData = JSON.parse(existingUser);
    const passwordMatch = await bcrypt.compare(password, userData.hashedPassword);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid password.' });
      return;
    }

    const token = jwt.sign({ username, id: userData.id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'User logged in successfully.', username, token });
  } catch (error) {
    handleError(res, error, 'Error fetching all events');
  }
};

const addBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = addBalanceSchema.parse(req.body);
    const { balance } = parsedData;

    if (!req.user || !req.user.id || !req.user.username  || req.user.role !== 'user') {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const userId = req.user.id;

    channel.sendToQueue(
      'userQueue',
      Buffer.from(JSON.stringify({ id: userId, balance }))
    );

    const existingUser = await redisClient.get(`username:${req.user.username}`);
    if (!existingUser) {
      res.status(400).json({ message: 'Username not in cache!' });
      return;
    }

    const userData = JSON.parse(existingUser);

    await redisClient.set(
      `username:${req.user.username}`,
      JSON.stringify({
        hashedPassword: userData.hashedPassword,
        role: userData.role,
        id: userData.id,
        balance: userData.balance + balance,
        locked: userData.locked
      }),
      { EX: 86400 }
    );

    res.status(200).json({ message: 'Balance updated successfully.' });
  } catch (error) {
    handleError(res, error, 'Error fetching all events');
  }
};

const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user ||  req.user.role !== 'user') {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const details = await redisClient.get(`username:${req.user.username}`);
    if (!details) {
      res.status(400).json({ message: 'Username not in cache!' });
      return;
    }

    const userData = JSON.parse(details);
    delete userData.hashedPassword;
    delete userData.id;
    res.status(200).json({ message: 'User details retrieved successfully.', userData });
  } catch (error) {
    handleError(res, error, 'Error fetching all events');
  }
};

const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const allUsernames = await redisClient.keys('username:*');
    const usersData = await Promise.all(allUsernames.map(async (key) => {
      const userData = await redisClient.get(key);
      return userData ? JSON.parse(userData) : null;
    }));

    res.status(200).json({ message: 'All users retrieved successfully.', users: usersData.filter(user => user !== null) });
  } catch (error) {
    handleError(res, error, 'Error fetching all events');
  }
};

export { loginUser, registerUser, addBalance, getUser, getAllUsers };
