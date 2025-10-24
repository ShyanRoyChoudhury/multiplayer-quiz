// src/App.tsx
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// connect to backend (adjust URL if backend runs elsewhere)
const socket = io('http://localhost:3000')  

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected to socket server:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('disconnected')
    })

    // cleanup
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Socket.io</h1>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>count is {count}</button>
      </div>
    </>
  )
}

export default App
