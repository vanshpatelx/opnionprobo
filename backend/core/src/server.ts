import express, { Express, Request, Response } from "express";
import amqp, { Channel } from 'amqplib';
import { createClient, RedisClientType } from 'redis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod'; // Import Zod for validation

const app: Express = express();
const port = process.env.PORT || 3000;
let channel: Channel;
let redisClient: RedisClientType;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

async function setupRedis() {
  redisClient = createClient({ url: 'redis://localhost:6379' });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
}

async function setupPublisher() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    channel = await connection.createChannel();
    await channel.assertQueue('orderQueue', { durable: true }); // addUser
    await channel.assertQueue('eventQueue', { durable: true }); // addEvent
    await channel.assertQueue('userQueue', { durable: true }); // orderPlacement
    console.log('Connected to RabbitMQ with orderQueue, eventQueue, and userQueue');
  } catch (error) {
    console.error('Error setting up RabbitMQ:', error);
  }
}


app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

const registerSchema = z.object({
  username: z.string().email('Invalid username/email format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().email('Invalid username/email format.'),
  password: z.string().min(1, 'Password is required.'),
});

// Events Management
app.get('/events', (req: Request, res: Response) => {
  // get All events
});
app.get('/events/:id', (req: Request, res: Response) => {
  // get event
});
app.post('/events', (req: Request, res: Response) => {
  // add event
});

// User Management
app.post('/register', async (req: Request, res: Response) => {
  try {
    const parsedData = registerSchema.parse(req.body); // Zod
    const { username, password, role } = parsedData;

    const existingUser = await redisClient.get(`username:${username}`);
    if (existingUser) {
      res.status(400).json({ message: 'User already registered.', username });
      return
    }

    const userRole = role || 'user';
    const hashedPassword = await bcrypt.hash(password, 10);
    channel.sendToQueue('userQueue', Buffer.from(JSON.stringify({ username, hashedPassword, role: userRole })));
    await redisClient.set(`username:${username}`, JSON.stringify({ hashedPassword, role: userRole }), { EX: 86400 });
    const token = jwt.sign({ username, role: userRole }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ message: 'User registered successfully.', username, token });
    return
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors.map(e => e.message).join(", ") });
      return
    }
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.parse(req.body); // zod
    const { username, password } = parsedData;

    const existingUser = await redisClient.get(`username:${username}`);
    if (!existingUser) {
      res.status(400).json({ message: 'Username not registered!', username });
      return
    }

    const userData = JSON.parse(existingUser);
    const passwordMatch = await bcrypt.compare(password, userData.hashedPassword);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid password.' });
      return
    }

    const token = jwt.sign({ username, role: userData.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'User logged in successfully.', username, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors.map(e => e.message).join(", ") });
      return
    }
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Order Management
app.post('/order', (req: Request, res: Response) => {
  // place order
});
app.get('/getOrderBook', (req: Request, res: Response) => {
  // get Orderbook
});

// for dev purpose
// reset
// adding categories

app.listen(port, async () => {
  await setupPublisher();
  await setupRedis();
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// middleware auth
// const authenticateJWT = (req: Request, res: Response, next: Function) => {
//   const token = req.headers['authorization']?.split(' ')[1]; // Bearer token
  
//   if (!token) {
//     return res.sendStatus(401); // Unauthorized
//   }
  
//   jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
//     if (err) {
//       return res.sendStatus(403); // Forbidden
//     }
//     req.user = user;
//     next();
//   });
// };
