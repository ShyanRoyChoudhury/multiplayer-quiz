"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { socket } from "@/socket"
import { useParams } from "react-router-dom"
import { toast } from "sonner"

function Room() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [userReady, setUserReady] = useState(false)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [readyCount, setReadyCount] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const { roomId, username } = useParams()
  const [connectionStatus, setConnectionStatus] = useState("connecting"); 
  const [leaderboardData, setLeaderboard] = useState([])

  useEffect(() => {
    
    socket.on("connect", () => {
      console.log("Socket connected, joining room...")
      setConnectionStatus("connected");
      socket.emit("join-room", { roomId, username })
      
      // Check if user was already ready before refresh
      socket.emit("check-ready-status", { roomId, username }, (response: any) => {
        if (response) {
          console.log("Received status:", response)
          setUserReady(response.isReady)
          setReadyCount(response.readyPlayers)
          setTotalPlayers(response.totalPlayers)
          setQuizStarted(response.quizStarted)
          
          // Restore current question if quiz has started
          if (response.currentQuestion) {
            setCurrentQuestion(response.currentQuestion)
          }
          
          // Restore score
          if (response.score !== undefined) {
            setScore(response.score)
          }
          
          // Restore leaderboard
          if (response.leaderboard && Array.isArray(response.leaderboard)) {
            setLeaderboard(response.leaderboard)
          }
        }
      })
    })
    
    socket.on("room-joined", (msg) => {
      console.log("Room joined:", msg)
      // Update totalPlayers when someone joins
      setTotalPlayers(msg.userCount)
    })
    
    socket.on("user-left", (msg) => {
      toast("User Left:", msg)
      // Update totalPlayers when someone joins
      console.log("msg", msg)
      setTotalPlayers(msg.userCount)
    })
    
    socket.on("ready-status", ({ readyPlayers, totalPlayers }) => {
      setReadyCount(readyPlayers)
      setTotalPlayers(totalPlayers)
    })
    
    socket.on("all-ready", () => {
      toast("All players ready! Starting quiz...")
      setUserReady(true)
      setQuizStarted(true)
    })
    
    socket.on("new-question", (question)=> {
      console.log("question", question)
      setCurrentQuestion(question)
      setQuizStarted(true)
    })
    
    socket.on("answer-result", ({ username: winner, leaderboard, correct }) => {
      if (correct) {
        if (winner === username) {
          toast("Correct answer Congrats 🎉")
          
        }
      }
      console.log('leaderboard test', leaderboard)
      setLeaderboard(leaderboard)
      const userEntry = leaderboard.find((entry: any) => entry.name === username)
      console.log("userEntry", userEntry)
      if (userEntry) {
        setScore(userEntry.score)
      }
      console.log("userEntry.name", userEntry.name)
      console.log("username", username)
      if (userEntry.name !== username){
        toast(`${userEntry.name} answered the question`)
      }
    });
    
    // Listen for personal answer feedback (wrong/too late)
    socket.on("answer-status", ({ correct, message }) => {
      if (!correct) {
        toast.error('message', message)
        // setFeedback(message || "Incorrect answer!");
      }
    });
    socket.on("leaderboard", ({ updatedScores }) => {
      if (Array.isArray(updatedScores) && username) {
      // Find this user's entry
      const userEntry = updatedScores.find((entry) => entry.name === username)

      if (userEntry) {
        setScore(userEntry.score)
      }
    }
    });
      
    socket.on("disconnect", () => {
      console.log("Disconnected")
      setConnectionStatus("disconnected");
    })

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setConnectionStatus("connected");
      socket.emit("join-room", { roomId, username }); // rejoin room after reconnect
      
      // recheck ready status after reconnect
      socket.emit("check-ready-status", { roomId, username }, (response: any) => {
        if (response) {
          setUserReady(response.isReady)
          setReadyCount(response.readyPlayers)
          setTotalPlayers(response.totalPlayers)
          setQuizStarted(response.quizStarted)
        }
      })
    });

    
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setConnectionStatus("disconnected");
    })
    
    socket.connect()
  return () => {
    socket.off("connect")
    socket.off("room-joined")
    socket.off("ready-status")
    socket.off("user-left")
    socket.off("all-ready")
    socket.off("new-question")
    socket.off("answer-status")
    socket.off("answer-result")
    socket.off("leaderboard")
    socket.off("disconnect")
    socket.off("reconnect")
    socket.off("connect_error")
    socket.disconnect()
  }
}, [roomId, username])


  const handleSubmit = () => {
    if (answer.trim()) {
      console.log("[v0] Answer submitted:", answer)
      setSubmitted(true)
      socket.emit("submit-answer", { roomId, username, answer }, (err: any, response: any) => {
        if (err) {
          console.log("err", err)
          console.error("Server did not respond in time");
          alert("Network issue — your answer may not have been received.");
        } else {
          console.log("Answer confirmed:", response);
        }
      });

          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setAnswer("")
          setSubmitted(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitted) {
      handleSubmit()
    }
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {!quizStarted ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-foreground/70">
              {readyCount}/{totalPlayers} players ready
            </p>

            <Button
              onClick={() => {
                setUserReady(true)
                socket.emit("player-ready", { roomId, username })
              }}
              disabled={userReady}
              className={`mt-8 ${userReady?'bg-green-500':''}`}
            >
              { userReady?<p>Waiting for others</p>: <p>I am ready</p> }
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="font-sentient text-4xl font-light tracking-wide text-foreground md:text-5xl">
                Quiz Battle
              </h1>
              <p className={`mt-2 text-sm text-foreground/60 ${connectionStatus==='connected'?'text-green-300':'text-red-400'}`}>
              {connectionStatus}
              </p>
            </div>

            {/* Active users */}
            <div className="mb-8 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-foreground/60">Active Users</p>
                <p className="mt-2 text-3xl font-mono font-bold text-primary">{totalPlayers}</p>
              </div>
            </div>

            {/* Score Display */}
            <div className="mb-8 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-foreground/60">Score</p>
                <p className="mt-2 text-3xl font-mono font-bold text-primary">{score}</p>
              </div>
            </div>

            {/* Question Card */}
            <div className="mb-8 rounded-lg border border-border bg-background/40 p-8 backdrop-blur-sm">
              <p className="font-sentient text-2xl font-light leading-relaxed text-foreground md:text-3xl">
                {currentQuestion}
              </p>
            </div>

            {/* Answer Input Section */}
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={submitted}
                  className="h-14 border-border bg-background/40 px-4 text-base placeholder:text-foreground/40 focus-visible:border-primary focus-visible:ring-primary/50"
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitted || !answer.trim()} className="w-full">
                {submitted ? "Checking Answer..." : "Submit Answer"}
              </Button>
            </div>

            <div className="lg:col-span-1 mt-16">
          <div className="sticky top-8 rounded-lg border border-border bg-background/40 p-6 backdrop-blur-sm">
            <h2 className="font-sentient text-2xl font-light tracking-wide text-foreground">Leaderboard</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-foreground/60">Top Players</p>

            {/* Leaderboard Table */}
            <div className="mt-10 space-y-3">
              {leaderboardData.map((entry: any) => (
                <div
                  key={entry}
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background/20 px-4 py-3 transition-colors hover:bg-background/40"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-bold text-primary">{entry.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Room