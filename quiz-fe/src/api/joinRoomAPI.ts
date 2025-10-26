import { VITE_API_URL } from "@/config"
import axios from "axios"

async function joinRoomAPI(roomId: string, username: string){
    try{
        const response = await axios.post(`${VITE_API_URL}/join-room`, {
            username, roomId
        })
        if(response.status != 200){
            throw new Error("")
        }

        return response.data
    }catch(err){
        console.log("something went wrong")

        return null
    }
}

export default joinRoomAPI