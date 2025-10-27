import { Server, Socket } from "socket.io";
import { redisClient } from "../../redisClient.js";
import { getNextQuestion } from "../../utils/questionUtils.js";

export function registerQuizHandlers(io: Server, socket: Socket) {

  socket.on("player-ready", async ({ roomId, username }, callback) => {
    try {
      // mark player as ready in Redis
      await redisClient.sAdd(`room:${roomId}:ready`, username);
      await redisClient.expire(`room:${roomId}:ready`, 600);
      // get total and ready counts
      const totalPlayers = await redisClient.sCard(`room:${roomId}:users`);
      const readyPlayers = await redisClient.sCard(`room:${roomId}:ready`);

      // emit updated readiness status to everyone
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

        // reset the ready set for next round
        await redisClient.del(`room:${roomId}:ready`);
      }

      return callback?.({ status: "ok" });
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

  socket.on("submit-answer", async ({ roomId, username, answer }, callback) => {
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

    if (answer.trim().toLowerCase() === question.correct.trim().toLowerCase()) {
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
      
      const users = await redisClient.sMembers(`room:${roomId}:users`);
let updatedScores = await redisClient.hGetAll(scoresKey);

// Ensure all users exist in the leaderboard
for (const user of users) {
  if (!(user in updatedScores)) {
    updatedScores[user] = "0";
    await redisClient.hSet(scoresKey, user, 0);
    await redisClient.expire(scoresKey, 600);
  }
}

// Convert Redis object → sorted array [{ name, score }]
const leaderboardArray = Object.entries(updatedScores)
  .map(([name, score]) => ({
    name,
    score: parseInt(score, 10),
  }))
  .sort((a, b) => b.score - a.score); // highest first

console.log("Leaderboard Array:", leaderboardArray);

io.to(roomId).emit("answer-result", { username, leaderboard: leaderboardArray, correct: true });
io.to(roomId).emit("leaderboard", { leaderboard: leaderboardArray });


      // Fetch and send next question
      const nextQuestion = await getNextQuestion();
      if (nextQuestion) {
        await redisClient.set(currentQuestionKey, JSON.stringify(nextQuestion));
        await redisClient.del(answeredKey); // clear for next round

        // small delay before next question
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

    return callback(null, { status: "ok" });
  } catch (err) {
    console.error("Error in submit-answer:", err);
    socket.emit("error", { message: "Failed to process answer" });
  }
});

}