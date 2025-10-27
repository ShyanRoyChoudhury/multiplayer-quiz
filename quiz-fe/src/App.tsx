// src/App.tsx

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import './App.css'
import {Dashboard} from './pages/dashboard'
import Room from './pages/room'
import { Toaster } from "@/components/ui/sonner"


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
          
          <Toaster />
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
