import { VITE_API_URL } from "@/config"
import axios from "axios"

async function createRoomAPI(newRoomName: string, username: string){
    try{
        const response = await axios.post(`${VITE_API_URL}/create-room`, {
            roomName: newRoomName,
            username
        })
        if(response.status != 201){
            throw new Error("")
        }

        return response.data
    }catch(err){
        console.log("something went wrong")

        return null
    }
}

export default createRoomAPI