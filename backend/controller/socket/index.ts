import { Server, Socket } from "socket.io";
import { registerRoomHandlers } from "./roomHandlers.js";
import { registerQuizHandlers } from "./quizHandler.js";

export function registerSocketHandlers(io: Server, socket: Socket) {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Room-related events
  registerRoomHandlers(io, socket);

  // Quiz-related events
  registerQuizHandlers(io, socket);
}
