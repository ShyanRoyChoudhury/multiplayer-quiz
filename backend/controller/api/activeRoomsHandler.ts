import { Request, Response } from "express";
import { redisClient } from "../../redisClient.js";



async function activeRoomsHandler(req: Request, res: Response) {
  try {
    const allKeys = await redisClient.keys("room:*");   // can use scan here instead of keys
    const keys = allKeys.filter((key) => {
      // Split by ':' and check if there are exactly 2 parts
      const parts = key.split(':');
      return parts.length === 2;
    });
    console.log('keys', keys)
    if (!keys.length) {
      return res.status(200).json({
        success: true,
        rooms: [],
        message: "No active rooms found",
      });
    }

    const rooms = [];

    // Process keys sequentially to avoid race conditions
    for (const key of keys) {
      try {
        // Check the type of the key first
        const keyType = await redisClient.type(key);
        
        if (keyType !== "hash") {
          console.warn(`Skipping key ${key} - type: ${keyType}`);
          continue;
        }

        const data = await redisClient.hGetAll(key);
        
        // Skip if no data returned
        if (!data || Object.keys(data).length === 0) {
          console.warn(`Skipping key ${key} - no data`);
          continue;
        }

        rooms.push({
          roomId: key.split(":")[1],
          ...data,
        });
      } catch (err) {
        console.error(`Error processing key ${key}:`, err);
        // Continue processing other keys
      }
    }

    rooms.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (err) {
    console.error("Error listing active rooms:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export default activeRoomsHandler;