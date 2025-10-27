import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { redisClient } from "../../redisClient.js";

async function createRoomHandler(req: Request, res: Response){
    try {
        const { username, roomName } = req.body;
        if (!username) {
        return res.status(400).json({ message: "username is required" });
        }

        const roomId = randomUUID().slice(0, 6); // generate short room code

        // Store room metadata
        await redisClient.hSet(`room:${roomId}`, [
            "host", username,
            "createdAt", Date.now().toString(),
            "roomName", roomName
        ]);
        await redisClient.expire(`room:${roomId}`, 600);
        await redisClient.sAdd(`room:${roomId}:users`, username);
        await redisClient.expire(`room:${roomId}:users`, 600);      // exprire after 10 min

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