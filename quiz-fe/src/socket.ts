import { VITE_SOCKET_URL } from './config'
import { io } from 'socket.io-client'


const SOCKET_URL = `${VITE_SOCKET_URL}`
console.log("SOCKET_URL", SOCKET_URL)
export const socket = io(SOCKET_URL, {
  autoConnect: false, // connect only when you need it
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ["websocket"],
});