import { createClient } from 'redis'
import dotenv from "dotenv";
dotenv.config();


const redisPort = process.env.REDIS_PORT as number | undefined
const redisHost = process.env.REDIS_HOST  as string
const redisPassword = process.env.REDIS_PASSWORD as string

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
    tls: true,
    // @ts-ignore
    keepAlive: 5000, // Send keepalive every 5 seconds
    reconnectStrategy: (retries: any) => {
      if (retries > 10) {
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000); // Exponential backoff
    }
  },
  password: redisPassword

});
redisClient.on('error', (err: Error) => console.error('Redis Client Error', err))

await redisClient.connect()