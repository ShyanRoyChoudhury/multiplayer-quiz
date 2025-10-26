import { Server, Socket } from "socket.io";
import { redisClient } from "../../redisClient.js";
import { getNextQuestion } from "../../utils/questionUtils.js";

export function registerQuizHandlers(io: Server, socket: Socket) {

  socket.on("player-ready", async ({ roomId, username }) => {
    try {
      // Mark player as ready in Redis (v4+ syntax)
      await redisClient.sAdd(`room:${roomId}:ready`, username);

      // Get total and ready counts
      const totalPlayers = await redisClient.sCard(`room:${roomId}:users`);
      const readyPlayers = await redisClient.sCard(`room:${roomId}:ready`);

      // Emit updated readiness status to everyone
      io.to(roomId).emit("ready-status", {
        readyPlayers,
        totalPlayers,
      });

      console.log(`${username} is ready (${readyPlayers}/${totalPlayers})`);

      // If all are ready, start quiz
      if (readyPlayers === totalPlayers) {
        io.to(roomId).emit("all-ready");
        console.log(`All players ready in room ${roomId}. Starting quiz...`);

        
        const question = await getNextQuestion();
        await redisClient.set(`room:${roomId}:currentQuestion`, JSON.stringify(question));
        io.to(roomId).emit("new-question", question.text);

        // Reset the ready set for next round
        await redisClient.del(`room:${roomId}:ready`);
      }
    } catch (err) {
      console.error("Error in player-ready:", err);
      socket.emit("error", { message: "Failed to mark ready" });
    }
  });

  socket.on("start-quiz", async ({ roomId }) => {
    const question = await getNextQuestion();
    io.to(roomId).emit("new-question", question.text);

    await redisClient.set(`room:${roomId}:currentQuestion`, JSON.stringify(question));
    await redisClient.del(`room:${roomId}:answered`);
  });

  socket.on("submit-answer", async ({ roomId, username, answer }) => {
  const answeredKey = `room:${roomId}:answered`;
  const currentQuestionKey = `room:${roomId}:currentQuestion`;
  const scoresKey = `room:${roomId}:scores`;

  try {
    // Watch the answered key to detect concurrent modifications
    await redisClient.watch(answeredKey);

    const answered = await redisClient.get(answeredKey);
    if (answered) {
      // Someone already answered
      await redisClient.unwatch();
      socket.emit("answer-status", { correct: false, message: "Too late! Someone already answered." });
      return;
    }

    const questionStr = await redisClient.get(currentQuestionKey);
    if (!questionStr) {
      await redisClient.unwatch();
      socket.emit("error", { message: "No active question found" });
      return;
    }

    const question = JSON.parse(questionStr);

    if (answer === question.correct) {
      // Begin atomic transaction
      const tx = redisClient.multi();

      tx.set(answeredKey, username);
      tx.hIncrBy(scoresKey, username, 1);

      const results = await tx.exec(); // commit transaction
      if (!results) {
        // Another client modified the key -> race condition occurred
        socket.emit("answer-status", { correct: false, message: "Too late! Someone already answered." });
        return;
      }

      // Get updated scores
      const updatedScores = await redisClient.hGetAll(scoresKey);
      console.log("updatedScores", updatedScores)
      io.to(roomId).emit("answer-result", { username, correct: true });
      io.to(roomId).emit("score-update", {updatedScores});


      // Fetch and send next question
      const nextQuestion = await getNextQuestion();
      if (nextQuestion) {
        await redisClient.set(currentQuestionKey, JSON.stringify(nextQuestion));
        await redisClient.del(answeredKey); // clear for next round

        // Optional: small delay before next question
        setTimeout(() => {
          io.to(roomId).emit("new-question", nextQuestion.text);
          console.log(`Next question sent to room ${roomId}`);
        }, 2000); // wait 2s before next question
      } else {
        io.to(roomId).emit("quiz-complete");
        console.log(`Quiz complete for room ${roomId}`);
      }
    } else {
      await redisClient.unwatch();
      socket.emit("answer-status", { correct: false });
    }
  } catch (err) {
    console.error("Error in submit-answer:", err);
    socket.emit("error", { message: "Failed to process answer" });
  }
});

}