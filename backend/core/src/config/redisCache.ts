import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

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

async function loadRedis() {
  redisClient = createClient({ url: 'redis://localhost:6379' });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
}


export { setupRedis, redisClient, loadRedis }