import { Server, Socket } from "socket.io";

export function registerSocketHandlers(io: Server, socket: Socket) {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Future handlers (e.g. join-room, answer-question, etc.)
}