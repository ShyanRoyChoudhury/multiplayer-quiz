"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Pill } from "@/components/pill"
import createRoomAPI from "@/api/createRoomAPI"
import { useNavigate } from "react-router-dom"
import activeRoomAPI from "@/api/activeRoomsAPI"
import joinRoomAPI from "@/api/joinRoomAPI"
interface Room {
  roomId: string
  roomName: string
//   players: number
//   maxPlayers: number
}

export function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([
  ])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [joinRoomForm, setJoinRoomForm] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState("")
  const [username, setUsername] = useState<string | null>(null)
  const navigate = useNavigate();
  
  const getActiveRooms = async() => {
    const res = await activeRoomAPI()
    setRooms(res.rooms)
  }
  useEffect(()=> {
    getActiveRooms()
  })


  const handleCreateRoom = async() => {
    try{
        if (newRoomName.trim()) {
            if(username && newRoomName){
                const newRoom = await createRoomAPI(newRoomName, username)
                //   const newRoom: Room = {
                    //     id: Date.now().toString(),
                    //     name: newRoomName,
                    //     players: 1,
                    //     maxPlayers: 8,
                    //   }
                    //   setRooms([...rooms, newRoom])
                if(!newRoom){
                    console.log("room creation failed")   
                }
                setNewRoomName("")
                setShowCreateForm(false)
                console.log("[v0] Room created:", newRoom)
                navigate(`/room/${newRoom?.roomId}`)
            }
        }
    }catch(err){
        console.log("Error creating room")
    }
  }

  const handleJoinRoom = async () => {
    try{
        if(roomId && username){
            const res = await joinRoomAPI(roomId, username)
            if(res.success != true){
                console.log(`something went wrong: ${res?.message}`)
            }
            navigate(`/room/${res?.roomId}/${username}`)
        }
    }catch(err){

    }
  }

  return (
    <div className="relative z-10 min-h-svh flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
            <Pill className="mb-6 justify-center">MULTIPLAYER QUIZ</Pill>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient mb-4">
            Quiz <br />
            <i className="font-light">Battles</i>
            </h1>
            <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance max-w-[440px] mx-auto">
            Challenge your friends in real-time multiplayer quiz competitions
            </p>
        </div>

        {/* Create Room Section */}
        <div className="mb-12">
            {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
                [+ Create Room]
            </Button>
            ) : (
            <Card className="p-6 bg-background/50 border border-border">
                <h3 className="text-lg text-white font-mono font-semibold mb-4">Create New Room</h3>
                <div className="flex flex-col sm:flex-row gap-3">

                <input
                    type="text"
                    placeholder="Enter username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
                    className="flex-1 px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                    autoFocus
                />                    
                <input
                    type="text"
                    placeholder="Enter room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
                    className="flex-1 px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                    autoFocus
                />
                <div className="flex gap-2">
                    <Button onClick={handleCreateRoom} className="flex-1 sm:flex-none">
                    [Create]
                    </Button>
                    <Button
                    onClick={() => {
                        setShowCreateForm(false)
                        setNewRoomName("")
                    }}
                    variant="default"
                    className="flex-1 sm:flex-none bg-background border-border text-foreground hover:bg-background/80"
                    >
                    [Cancel]
                    </Button>
                </div>
                </div>
            </Card>
            )}
        </div>

        {/* Join Room Section */}
        <div className="mb-12">
            {joinRoomForm && (
            <Card className="p-6 bg-background/50 border border-border">
                <h3 className="text-lg text-white font-mono font-semibold mb-4">Join Room</h3>
                <div className="flex flex-col sm:flex-row gap-3">

                <input
                    type="text"
                    placeholder="Enter username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
                    className="flex-1 px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                    autoFocus
                />                    

                <div className="flex gap-2">
                    <Button onClick={handleJoinRoom} className="flex-1 sm:flex-none">
                    [Join]
                    </Button>
                    <Button
                    onClick={() => {
                        setShowCreateForm(false)
                        setJoinRoomForm(false)
                    }}
                    variant="default"
                    className="flex-1 sm:flex-none bg-background border-border text-foreground hover:bg-background/80"
                    >
                    [Cancel]
                    </Button>
                </div>
                </div>
            </Card>
            )}
        </div>



        {/* Active Rooms */}
        <div>
            <h2 className="text-2xl font-mono font-semibold mb-6 text-foreground/80">Active Rooms ({rooms.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
                <Card
                key={room?.roomId}
                className="p-6 bg-background/50 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-mono font-semibold text-white group-hover:text-primary transition-colors">
                    {room?.roomName}
                    </h3>
                    <span className="text-xs font-mono text-foreground/60 bg-background px-2 py-1 border border-border">
                    {/* {room.players}/{room.maxPlayers} */}
                    </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-2 bg-background border border-border overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all"
                        // style={{ width: `${(room.players / room.maxPlayers) * 100}%` }}
                    />
                    </div>
                </div>
                <Button className="w-full text-sm" onClick={()=> {
                    setJoinRoomForm(true)
                    setRoomId(room?.roomId)
                }}>[Join Room]</Button>
                </Card>
            ))}
            </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-12 pt-8 border-t border-border/30 flex justify-around text-center">
            <div>
            <p className="text-2xl font-mono font-bold text-primary">{rooms.length}</p>
            <p className="text-xs font-mono text-foreground/60 mt-1">Active Rooms</p>
            </div>
            <div>
            <p className="text-2xl font-mono font-bold text-primary">
                {rooms.reduce((sum, room) => sum + room?.players, 0)}
            </p>
            <p className="text-xs font-mono text-foreground/60 mt-1">Players Online</p>
            </div>
            <div>
            <p className="text-2xl font-mono font-bold text-primary">
                {rooms.reduce((sum, room) => sum + (room?.maxPlayers - room?.players), 0)}
            </p>
            <p className="text-xs font-mono text-foreground/60 mt-1">Spots Available</p>
            </div>
        </div>
        </div>
    </div>
  )
}
