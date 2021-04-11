import { Socket } from "socket.io";
import { io } from "../server";
import { getSocketIdFromUser } from "./root";

export const video = (socket: Socket) => {

    /**
     * Peer id forwarder
     */
    socket.on("sending-peerid", (data) => {

        const partnerSocketId = getSocketIdFromUser(data.to);

        if(partnerSocketId){
            io.to(partnerSocketId).emit("forwarded-calling", data);
        }

    })

    /**
     * Video peer id reply forwarder
     */
    socket.on("send-video-peerid", data => {

        console.log("send-video-peerid")
        
        const partnerSocketId = getSocketIdFromUser(data.to);

        if(partnerSocketId){
            io.to(partnerSocketId).emit("forwarded-peerid", data);
        }
    })

}