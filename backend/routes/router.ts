import { Router } from "express";
import createRoomHandler from "../controller/api/createRoomHandler";

const router = Router();

router.post('/create-room', createRoomHandler);


export default router;