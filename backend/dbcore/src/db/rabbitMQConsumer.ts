import amqp from 'amqplib';
import {processOrder} from '../models/orderDB'
const RABBITMQ_URL = 'amqp://localhost:5672';

interface Order {
  eventId: string;
  side: 'yes' | 'no';
  type: 'buy' | 'sell';
  qty: number;
  price: number;
  filledQuantity: number;
  status: 'Not Executed' | 'Partial' | 'Done';
}

interface Event {
  id: string;
  name: string;
  endTime: Date;
  description: string;
  sourceOfTruth: string;
}

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
}

async function processEvent(event: Event) {
  console.log('Processing Event:', event);
}

async function processUser(user: User) {
  console.log('Processing User:', user);
}

async function startConsuming() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await Promise.all([
      channel.assertQueue('orderQueue', { durable: true }),
      channel.assertQueue('eventQueue', { durable: true }),
      channel.assertQueue('userQueue', { durable: true }),
    ]);

    console.log('Connected to RabbitMQ and waiting for messages...');

    channel.consume('orderQueue', (msg) => {
      if (msg !== null) {
        const order: Order = JSON.parse(msg.content.toString());
        processOrder(order);
        channel.ack(msg);
      }
    });

    channel.consume('eventQueue', async (msg) => {
      if (msg !== null) {
        const event: Event = JSON.parse(msg.content.toString());
        await processEvent(event);
        channel.ack(msg);
      }
    });

    channel.consume('userQueue', async (msg) => {
      if (msg !== null) {
        const user: User = JSON.parse(msg.content.toString());
        await processUser(user);
        channel.ack(msg);
      }
    });

  } catch (error) {
    console.error('Error setting up RabbitMQ consumer:', error);
  }
}

export { startConsuming };
