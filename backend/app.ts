import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import dotenv from 'dotenv'
import cors from 'cors'
import appRouter from './routes/router'
import { registerSocketHandlers } from './controller/socket';
dotenv.config()



const app = express()

app.use(express.json());
app.use(cors())
const server = createServer(app) 

const io = new Server(server, {
  cors: {
    origin: '*', 
  },
})

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  registerSocketHandlers(io, socket);
});

const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.json('Hello world')
})

app.use('/api', appRouter)

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})


