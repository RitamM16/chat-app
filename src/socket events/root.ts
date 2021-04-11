import { Socket } from "socket.io";
import {io} from "../server";
import chat from "./chat";
import { video } from "./video";
import { prisma } from "../routes/auth";

/**
 * A map that stores the user id to socket mapping
 */
const userToSocketMap: {[userid: number]: string | null} = {}

/**
 * Add a new socket user mapping
 * @param userid user id
 * @param socketid socket id
 */
export const addSocketUserMapping = (userid: number, socketid: string) => {
    userToSocketMap[userid] = socketid;
}

/**
 * Returns the socket id for a given userid
 * @param id user id
 * @returns socket id
 */
export const getSocketIdFromUser = (id: number) : string | null => {
    return userToSocketMap[id];
}

/**
 * Removes a socket user mapping
 */
export const removeSocketUserMapping = (userid: number) => {
    userToSocketMap[userid] = null;
}

/**
 * Sends user details to all other online users
 * @param socket Socket object
 */
export const sendUserDetailsToAllUsers = async (socket: Socket) => {

    const user = await prisma.user.findUnique({
        select: {
            name: true, email: true, id: true
        }, where: { id: socket.handshake.auth.token }
    })

    if(user) socket.broadcast.emit("new-user-online", user)
    
}

/**
 * Returns a list of online users
 * @returns array of users
 */
export const getAllUsers = async () => {

    const userIdList:number[] = [];

    for(let [key,value] of Object.entries(userToSocketMap)){
        let IntKey = parseInt(key)
        if(value) userIdList.push(IntKey)
    }

    const users = await prisma.user.findMany({
        select: {
            name: true,
            email: true,
            id: true
        },
        where: {
            id: {
                in: userIdList
            }
        }
    });

    return users;

}

export function rootSocketRoute(socket: Socket) {

    socket.emit("connected");

    chat(socket);

    video(socket);
}