// src/App.tsx

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import './App.css'
import {Dashboard} from './pages/dashboard'
import Room from './pages/room'
import { Toaster } from "@/components/ui/sonner"


function App() {

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
