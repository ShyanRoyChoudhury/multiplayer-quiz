import { createClient } from 'redis'
import dotenv from "dotenv";
dotenv.config();


const redisPort = process.env.REDIS_PORT as number | undefined
const redisHost = process.env.REDIS_HOST 
const redisPassword = process.env.REDIS_PASSWORD 

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
    tls: true,
  },
  password: redisPassword
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))

await redisClient.connect()