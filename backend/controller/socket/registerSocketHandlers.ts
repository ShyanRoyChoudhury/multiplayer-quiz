import { Server, Socket } from "socket.io";
import { redisClient } from "../../redisClient.js";

export function registerSocketHandlers(io: Server, socket: Socket) {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("join-room", async ({roomId, username}) => {
    try{
      console.log('join-room socket called')
      console.log("roomId, username", roomId, username)
        const roomExists = await redisClient.exists(`room:${roomId}`);

        if (!roomExists) {
            socket.emit("error", { message: `Room ${roomId} not found.` });
            console.warn(`Join attempt failed — Room ${roomId} not found by ${username}`);
            return;
        }
        console.log("reached befpre sadd")
        await redisClient.sadd(`room:${roomId}:users`, username);
        
        // Get updated user count
        const userCount = await redisClient.scard(`room:${roomId}:users`);

        socket.join(roomId);
        console.log('before room-joined')
        socket.emit("room-joined", { roomId, username, userCount });
        socket.to(roomId).emit("user-joined", { username });
        console.log('user room-joined')
    }catch(err){

    }
  });
}