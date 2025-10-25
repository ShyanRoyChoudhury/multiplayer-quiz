import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { redisClient } from "../../redisClient";

async function createRoomHandler(req: Request, res: Response){
    try {
        const { username, roomName } = req.body;
        if (!username) {
        return res.status(400).json({ message: "userId is required" });
        }

        const roomId = randomUUID().slice(0, 6); // generate short room code

        // Store room metadata
        await redisClient.hset(`room:${roomId}`, {
            host: username,
            createdAt: Date.now().toString(),
        });

        // Add user to room user list
        await redisClient.sadd(`room:${roomId}:users`, username);

        console.log(`Room created: ${roomId} by ${username}`);

        return res.status(201).json({
            success: true,
            roomId,
            roomName,
            message: "Room created successfully",
        });
    } catch (err) {
        console.error("Error creating room:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default createRoomHandler