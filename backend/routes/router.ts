import { Router } from "express";
import createRoomHandler from "../controller/api/createRoomHandler.js";
import activeRoomsHandler from "../controller/api/activeRoomsHandler.js";
import joinRoomHandler from "../controller/api/joinRoomHandler.js";

const router = Router();

router.post('/create-room', createRoomHandler);
router.get('/active-rooms', activeRoomsHandler);
router.post('/join-room', joinRoomHandler);



export default router;