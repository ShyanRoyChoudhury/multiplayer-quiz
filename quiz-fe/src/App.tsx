// src/App.tsx
import { useEffect } from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import './App.css'
import {Dashboard} from './pages/dashboard'
import Room from './pages/room'



function App() {

  // useEffect(() => {
  //   socket.on('connect', () => {
  //     console.log('connected to socket server:', socket.id)
  //   })

  //   socket.on('disconnect', () => {
  //     console.log('disconnected')
  //   })

  //   // cleanup
  //   return () => {
  //     socket.off('connect')
  //     socket.off('disconnect')
  //   }
  // }, [])

  return (
    <>
      <div>
        <Router>
          <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path='/room/:roomId/:username' element={<Room />} />
          </Routes>
        </Router>
      </div>
    </>
  )
}

export default App
