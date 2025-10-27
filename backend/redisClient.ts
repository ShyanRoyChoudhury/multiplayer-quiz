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
      // Infinite retries with exponential backoff
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis: Reconnecting... attempt ${retries}, delay ${delay}ms`);
      return delay;
    },
    connectTimeout: 10000,
  },
  password: redisPassword,
  disableOfflineQueue: false,
});

// Error handling
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

// Connection state management
let isConnecting = false;
let isConnected = false;

export async function connectRedis() {
  if (isConnected || isConnecting) {
    return redisClient;
  }
  
  isConnecting = true;
  
  try {
    await redisClient.connect();
    isConnected = true;
    isConnecting = false;
    console.log('Redis: Initial connection established');
    return redisClient;
  } catch (err) {
    isConnecting = false;
    console.error('Redis: Failed to connect:', err);
    // Don't throw - let it retry via reconnectStrategy
    console.log('Redis: Will retry connection automatically...');
  }
}

// Graceful shutdown
const shutdown = async () => {
  if (isConnected) {
    console.log('Redis: Closing connection...');
    try {
      await redisClient.quit();
    } catch (err) {
      console.error('Redis: Error during shutdown:', err);
      await redisClient.disconnect();
    }
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);