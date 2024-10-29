import express, { Express, Request, Response } from 'express';
import { setupPublisher } from './config/rabbitMQPublisher';
import { setupRedis} from './config/redisCache';
import userRoutes from './routes/userRoutes';
import orderRoutes from './routes/orderRoutes';
import eventRoutes from './routes/eventRoutes';

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});


app.use('/api/v1/users', userRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/events', eventRoutes);

app.listen(port, async () => {
  await setupPublisher();
  await setupRedis();
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
