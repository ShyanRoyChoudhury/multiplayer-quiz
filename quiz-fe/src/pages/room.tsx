"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { socket } from "@/socket"
import { useParams } from "react-router-dom"

interface Question {
  id: number
  text: string
  category: string
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is the capital of France?",
    category: "Geogr  aphy",
  },
  {
    id: 2,
    text: "What is the largest planet in our solar system?",
    category: "Science",
  },
  {
    id: 3,
    text: "In what year did World War II end?",
    category: "History",
  },
]

function Room() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answer, setAnswer] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    const { roomId, username } = useParams()

    useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);
  
    useEffect(() => {
      socket.connect()
    
      // Wait for connection to be established
      socket.on("connect", () => {
          console.log("Socket connected, joining room...")
          console.log("roomId, username:", roomId, username)
          socket.emit("join-room", { roomId, username })
      })

        socket.on("room-joined", (msg) => {
            console.log("Room joined:", msg)
        })

        // Handle connection errors
        socket.on("connect_error", (error) => {
            console.error("Connection error:", error)
        })

        return () => {
            socket.off("connect")
            socket.off("room-joined")
            socket.off("connect_error")
            socket.disconnect()
        }
    }, [roomId, username])


    const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex]

    const handleSubmit = () => {
        if (answer.trim()) {
        console.log("[v0] Answer submitted:", answer)
        setSubmitted(true)
        // Simulate scoring
        setScore(score + 1)

        // Move to next question after a delay
        setTimeout(() => {
            if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            setAnswer("")
            setSubmitted(false)
            }
        }, 1500)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !submitted) {
        handleSubmit()
        }
    }

    const isGameOver = currentQuestionIndex === SAMPLE_QUESTIONS.length - 1 && submitted

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-sentient text-4xl font-light tracking-wide text-foreground md:text-5xl">Quiz Battle</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
          </p>
        </div>

        {/* Score Display */}
        <div className="mb-8 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-foreground/60">Score</p>
            <p className="mt-2 text-3xl font-mono font-bold text-primary">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-foreground/60">Category</p>
            <p className="mt-2 text-lg font-mono text-foreground">{currentQuestion.category}</p>
          </div>
        </div>

        {/* Question Card */}
        <div className="mb-8 rounded-lg border border-border bg-background/40 p-8 backdrop-blur-sm">
          <p className="font-sentient text-2xl font-light leading-relaxed text-foreground md:text-3xl">
            {currentQuestion.text}
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

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={submitted || !answer.trim()} className="w-full">
            {submitted ? "Checking Answer..." : "Submit Answer"}
          </Button>
        </div>

        {/* Feedback */}
        {submitted && (
          <div className="mt-8 text-center">
            <p className="font-mono text-sm text-primary">✓ Answer recorded</p>
            {!isGameOver && <p className="mt-2 text-xs text-foreground/60">Moving to next question...</p>}
          </div>
        )}

        {/* Game Over State */}
        {isGameOver && (
          <div className="mt-12 text-center">
            <p className="font-sentient text-2xl font-light text-foreground">Quiz Complete!</p>
            <p className="mt-4 text-4xl font-mono font-bold text-primary">
              {score}/{SAMPLE_QUESTIONS.length}
            </p>
            <Button
              onClick={() => {
                setCurrentQuestionIndex(0)
                setAnswer("")
                setSubmitted(false)
                setScore(0)
              }}
              className="mt-8"
            >
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


export default Room;