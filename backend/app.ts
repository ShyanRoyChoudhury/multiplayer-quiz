import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'

const app = express()
const server = createServer(app) 
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
})


server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})


