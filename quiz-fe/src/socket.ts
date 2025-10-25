import { VITE_API_URL } from './config'
import { io } from 'socket.io-client'


export const socket = io(`${VITE_API_URL}/ws`)  