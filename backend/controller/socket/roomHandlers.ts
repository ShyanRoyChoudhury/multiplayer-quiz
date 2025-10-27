import { Server, Socket } from "socket.io";
import { redisClient } from "../../redisClient.js";

export function registerRoomHandlers(io: Server, socket: Socket) {
  console.log("user connected:", socket.id);

  socket.on("join-room", async ({ roomId, username }, callback) => {
    /* room join handler */
    try {
      console.log("join-room called:", roomId, username);

      // Check if room exists
      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        socket.emit("error", { message: `Room ${roomId} not found.` });
        console.warn(`Join attempt failed — Room ${roomId} not found by ${username}`);
        return;
      }

      // track username and room on socket
      (socket as any).username = username;
      (socket as any).roomId = roomId;

      // Add username to Redis set for this room
      await redisClient.sAdd(`room:${roomId}:users`, username);
      await redisClient.expire(`room:${roomId}:users`, 600);
      // get updated user count
      const userCount = await redisClient.sCard(`room:${roomId}:users`);
      socket.join(roomId);

      // notify user 
      socket.emit("room-joined", { roomId, username, userCount });
      socket.to(roomId).emit("user-joined", { username });

      console.log(`User ${username} joined room ${roomId}. Users now: ${userCount}`);
      return callback?.({ status: "ok" });
    } catch (err) {
      console.error("Error joining room:", err);
    }
  });

  
  socket.on("disconnect", async (reason) => {
    /* handle disconnects due to issues */
    const username = (socket as any).username;
    const roomId = (socket as any).roomId;

    if (!username || !roomId) return;

    console.log(`User disconnected: ${username} (${socket.id}), reason: ${reason}`);

    try {
      // remove user from Redis set
      await redisClient.sRem(`room:${roomId}:users`, username);

      // notify remaining users
      const userCount = await redisClient.sCard(`room:${roomId}:users`);
      socket.to(roomId).emit("user-left", { username, userCount });

      console.log(`user ${username} left room ${roomId}. Remaining users: ${userCount}`);
      if (userCount === 0) {
        console.log(`No users left in room ${roomId}. Cleaning up room data...`);

        const keysToDelete = [
          `room:${roomId}`,
          `room:${roomId}:users`,
          `room:${roomId}:currentQuestion`,
          `room:${roomId}:scores`,
          `room:${roomId}:answered`,
        ];

        // Delete all room-related keys
        await redisClient.del(keysToDelete);

        console.log(`Cleaned up all data for room ${roomId}`);
      }
    } catch (err) {
      console.error("Error handling disconnect:", err);
    }
  });
}
