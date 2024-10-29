import amqp, { Channel } from 'amqplib';
let channel: Channel;

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

export {setupPublisher, channel};