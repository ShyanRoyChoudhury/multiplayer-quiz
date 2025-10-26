import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { redisClient } from "../../redisClient.js";

async function joinRoomHandler(req: Request, res: Response){
    try {
        const { username, roomId } = req.body;
        if (!username || !roomId) {
        return res.status(400).json({ message: "username/roomId is required" });
        }

        // Check if room exists
        const roomExists = await redisClient.exists(`room:${roomId}:users`);
        if (!roomExists) {
            return res.status(404).json({ message: "Room not found", success: false });
        }

        return res.status(200).json({
            success: true,
            roomId,
            message: "Room joined successfully",
        });
    } catch (err) {
        console.error("Error creating room:", err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export default joinRoomHandler