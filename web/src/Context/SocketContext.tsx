import { createContext, useState } from "react";
import { io,Socket } from "socket.io-client";

export interface SocketContextProps {}

/**
 * Creates and connects a socket.io client to server
 * @param token user id
 * @returns Socket client object
 */
export function connectToServer(token: number):Socket{
    return io(`http://${window.location.hostname}:8000/`,{
        auth: {
            token
        }
    });
}

//@ts-ignore
export const SocketContext = createContext<{socket: Socket | null, setSocket: React.Dispatch<React.SetStateAction< Socket | null>>}>();
 
/**
 * Context Provider that provides a socket client for communication with the server
 */
const SocketContextProvider: React.FunctionComponent<SocketContextProps> = (props) => {

    const [socket, setSocket] = useState< Socket| null>(null);

    return (
        <SocketContext.Provider value={{socket, setSocket}}>
            {props.children}
        </SocketContext.Provider>
    );
}
 
export default SocketContextProvider;