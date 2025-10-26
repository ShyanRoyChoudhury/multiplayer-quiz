import { VITE_API_URL } from "@/config"
import axios from "axios"

async function activeRoomAPI(){
    try{
        const response = await axios.get(`${VITE_API_URL}/active-rooms`)
        if(response.status != 200){
            throw new Error("")
        }

        return response.data
    }catch(err){
        console.log("something went wrong")

        return null
    }
}

export default activeRoomAPI