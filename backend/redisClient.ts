import { createClient } from 'redis'
import dotenv from "dotenv";

dotenv.config();

const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
const redisHost = process.env.REDIS_HOST as string;
const redisPassword = process.env.REDIS_PASSWORD as string;

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
    tls: true,
    // @ts-ignore
    keepAlive: 5000,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.log('Redis: Too many reconnection attempts, stopping...');
        return new Error('Too many retries');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis: Reconnecting... attempt ${retries}, delay ${delay}ms`);
      return delay;
    },
    connectTimeout: 10000, // 10 second timeout
  },
  password: redisPassword,
  // Disable offline queue to prevent command buildup
  disableOfflineQueue: false,
});

// Better error handling
redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis: Connected successfully');
});

redisClient.on('ready', () => {
  console.log('Redis: Ready to accept commands');
});

redisClient.on('reconnecting', () => {
  console.log('Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('Redis: Connection closed');
});

// Connect with error handling
try {
  await redisClient.connect();
  console.log('Redis: Initial connection established');
} catch (err) {
  console.error('Redis: Failed to connect:', err);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Redis: Closing connection...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Redis: Closing connection...');
  await redisClient.quit();
  process.exit(0);
});