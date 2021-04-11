import { Socket } from "socket.io";
import { io } from "../server";
import { addSocketUserMapping, getAllUsers, getSocketIdFromUser, removeSocketUserMapping, sendUserDetailsToAllUsers } from "./root";

export interface message {
    id: string;
    from: number;
    message: string;
    time: string;
}

export default function chat(socket: Socket) {

    //Adds a new socket user mapping
    addSocketUserMapping(socket.handshake.auth.token as number, socket.id);

    //Broadcast the user details
    sendUserDetailsToAllUsers(socket);

    socket.on('disconnect', () => {

        //Removes the socket user mapping
        removeSocketUserMapping(socket.handshake.auth.token);

        //Make sure all the users know one of them went down
        io.sockets.emit("user-go-offline", socket.handshake.auth.token)
    })

    /**
     * Message forwarder
     */
    socket.on("new-message", (data, cb) => {
        
        const {message, to}: {roomid: string, message: message, to: number} = data;

        const partnerSocketId = getSocketIdFromUser(to);

        if(partnerSocketId){
            io.to(partnerSocketId).emit("message-received",{message});
            cb(true)
        }
    })

    /**
     * Hand shake forwarder
     */
    socket.on("start-handshake", (data) => {

        const partnerSocketId = getSocketIdFromUser(data.to);

        if(partnerSocketId){
            io.to(partnerSocketId).emit("forwarded-handshake", data);
        }
        
    })

    /**
     * Handshake reply forwarder
     */
    socket.on("forwarded-handshake-reply", (data) => {

        const partnerSocketId = getSocketIdFromUser(data.from);

        if(partnerSocketId){
            io.to(partnerSocketId).emit(`handshake-reply-${data.from}-${data.to}`, {publicKey: data.publicKey})
        }

    })

    /**
     * All online user list responder
     */
    socket.on("get-online-users", async (cb) => {

        const users = await getAllUsers();

        cb(users)

    })

    socket.on("resend-all-chat", (from,id,data) => {
        const partnerSocketId = getSocketIdFromUser(id);

        if(partnerSocketId){
            io.to(partnerSocketId).emit('forwarded-resend-all-chat',from,data);
        }
    })

}