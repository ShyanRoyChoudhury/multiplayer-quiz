import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { randomUUID } from "crypto";
import { createClient } from 'redis'
import dotenv from 'dotenv'
dotenv.config()



const app = express()
const server = createServer(app) 

const redisPort = process.env.REDIS_PORT as number | undefined
const redisHost = process.env.REDIS_HOST 
const redisPassword = process.env.REDIS_PASSWORD 

const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
    tls: true,
  },
  password: redisPassword
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))

await redisClient.connect()


const io = new Server(server, {
  cors: {
    origin: '*', 
  },
})

const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.json('Hello world')
})

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id)
  })

  
  socket.on("create-room", async ({ userId }) => {
    const roomId = randomUUID().slice(0, 6); 
    await redisClient.hset(`room:${roomId}`, { host: userId, createdAt: Date.now() });
    await redisClient.sadd(`room:${roomId}:users`, userId);

    socket.join(roomId);
    socket.emit("room-created", { roomId });
    console.log(`Room created: ${roomId} by ${userId}`);
  });
})


server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})


