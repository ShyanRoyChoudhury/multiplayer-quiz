"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { socket } from "@/socket"
import { useParams } from "react-router-dom"

function Room() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [userReady, setUserReady] = useState(false)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [readyCount, setReadyCount] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const { roomId, username } = useParams()

  useEffect(() => {
  socket.connect()

  socket.on("connect", () => {
    console.log("Socket connected, joining room...")
    socket.emit("join-room", { roomId, username })
  })

  socket.on("room-joined", (msg) => {
    console.log("Room joined:", msg)
    // Update totalPlayers when someone joins
    setTotalPlayers(msg.userCount)
  })

  socket.on("user-left", (msg) => {
    console.log("User Left:", msg)
    // Update totalPlayers when someone joins
    setTotalPlayers(msg.userCount)
  })

  socket.on("ready-status", ({ readyPlayers, totalPlayers }) => {
    setReadyCount(readyPlayers)
    setTotalPlayers(totalPlayers)
  })

  socket.on("all-ready", () => {
    console.log("All players ready! Starting quiz...")
    setUserReady(true)
  })

  socket.on("new-question", (question)=> {
    console.log("question", question)
    setCurrentQuestion(question)
  })

  socket.on("answer-result", ({ username: winner, correct }) => {
      if (correct) {
        // setFeedback(`${winner} answered correctly!`);
        if (winner === username) {
          setScore((prev) => prev + 1);
        }
      }
    });

    // Listen for personal answer feedback (wrong/too late)
    socket.on("answer-status", ({ correct, message }) => {
      if (!correct) {
        console.log('message', message)
        // setFeedback(message || "Incorrect answer!");
      }
    });
    socket.on("score-update", ({ updatedScores }) => {
      console.log('updatedScores', updatedScores)
      // if (!updatedScores) {
      //   // setFeedback(message || "Incorrect answer!");
      // }
    });
    


  socket.on("disconnect", () => {
      console.log("Disconnected")
    })

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error)
  })

  return () => {
    socket.off("connect")
    socket.off("room-joined")
    socket.off("ready-status")
    socket.off("user-left")
    socket.off("all-ready")
    socket.off("new-question")
    socket.off("answer-status")
    socket.off("answer-result")

    socket.off("disconnect")
    socket.off("connect_error")
    socket.disconnect()
  }
}, [roomId, username])


  const handleSubmit = () => {
    if (answer.trim()) {
      console.log("[v0] Answer submitted:", answer)
      setSubmitted(true)
      socket.emit("submit-answer", {roomId, username, answer})
      setScore(score + 1)
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
        {readyCount !== totalPlayers ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-foreground/70">
              {readyCount}/{totalPlayers} players ready
            </p>

            <Button
              onClick={() => {
                setUserReady(true)
                socket.emit("player-ready", { roomId, username })
              }}
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
              <p className="mt-2 text-sm text-foreground/60">
              </p>
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
          </>
        )}
      </div>
    </div>
  )
}

export default Room
