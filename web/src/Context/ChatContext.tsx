import { createContext, useState } from "react";
import { Socket } from "socket.io-client";
import { v4 as uuid} from "uuid";
//@ts-expect-error
import {Endcrypt} from "endcrypt";
import { authProfile } from "./AuthContext";

export interface ChatContextProviderProps {}

export interface message {
    id: string;
    from: number;
    message: string;
    time: string;
}

export interface room {
    id: string;
    user: number;
    endcrypt: any;
    isInitialized: boolean;
    messages: message[]
}

export interface user {
    id: number,
    name: string,
    email: string
}

export interface userDetail {
    name: string
    id: number,
    email: string,
    active: boolean,
    updatedAt: Date,
    unreadCount: number,
    isOnline: boolean
    //Can expand this with more info
}

export interface roomDictionary {
    [id: number]: room
}

export interface currentActiveUserDef {
    title: string,
    userid: number,
}

export type onRoomUpdateDef = (chatRoom: roomDictionary) => void
  
/**
 * Class that defines all the resources and method to use chat
 */
class ChatConnection {

    public setchatRoom: (value: roomDictionary) => void
    public setUserList: (value: userDetail[]) => void
    public setCurrentActiveChat: (value: currentActiveUserDef) => void

    constructor(
        private auth: authProfile,
        private socket: Socket,
        private chatRoom: roomDictionary,
        private userList: userDetail[],
        private currentActiveUser: currentActiveUserDef | null,
        setchatRoom: (value: roomDictionary) => void,
        setUserList: (value: userDetail[]) => void,
        setCurrentActiveChat: (value: currentActiveUserDef) => void
    ){

        this.setchatRoom = (value: roomDictionary) => {
            this.chatRoom = value;
            setchatRoom(value);
        }

        this.setUserList = (value: userDetail[]) => {
            this.userList = value;
            setUserList(value);
        }

        this.setCurrentActiveChat = (value: currentActiveUserDef) => {
            this.currentActiveUser = value;
            setCurrentActiveChat(value);
        }

        //All listeners for receiving messages and end-to-end encryption
        this.setOnForwardedHandshakeEvent();
        this.setOnMessageReceivedListener();
        this.setOnNewUserOnline();
        this.setOnUserGoOffline();
        this.setOnMessageResend();
        this.getUserList();
    }

    /**
     * Returns a new UserDetail object
     * @param user user info
     * @param active flag that tells if a user is having a active chat session open or not
     * @param isOnline flag that tells if a user is online or not
     * @returns userDetail
     */
    public createUserChatDetail(user: {
        id: number;
        name: string;
        email: string;
    },active: boolean = false, isOnline: boolean = false) : userDetail {
        return {...user,active,updatedAt: new Date(), unreadCount: 0, isOnline}
    }

    /**
     * Sets the unread message count to zero and sets them as current selected user
     * @param id userid of the user
     * @param name 
     */
    public setUnreadToZeroAndSetAsCurrent(id: number, name: string){
        let tempList = this.userList.map(user => {
            if(user.id === id){
                user.unreadCount = 0;
            }
            return user;
        })
        this.setUserList(tempList);
        this.setCurrentActiveChat({title: name, userid: id})
    }

    /**
     * Increments the unread count
     * @param id user id
     * @param amount The amount to be added
     * @returns void
     */
    public incrementUnread(id: number, amount: number = 1){
        if(this.currentActiveUser?.userid === id) return
        let tempList = this.userList.map(user => {
            if(user.id === id){
                user.unreadCount += amount;
            }
            return user;
        })
        this.setUserList(tempList);
    }

    /**
     * Sets user to active
     * @param id user id
     */
    public setUserAsActive(id: number) {
        let tempUser: userDetail | null = null;
        const temp = this.userList.filter(user => {
            if(user.id === id){
                tempUser = this.createUserChatDetail(user, true, true);
                return false
            } else return true;
        })

        console.log("The user is set as active", id)
        if(tempUser) this.setUserList([tempUser, ...temp])
    }

    /**
     * Adds a new room the chatroom map
     * @param room the initialized room object
     * @returns 
     */
    public async addRoom (room: room) {
        return new Promise(async (resolve, reject) => {
            const tempRooms = this.chatRoom;

            if(tempRooms[room.user]) return;

            tempRooms[room.user] = room;

            const user = this.getUserFromUserList(room.user);

            if(this.socket && this.auth && user){

                await this.performHandShake(room);

                this.setchatRoom(tempRooms)

                this.setUserAsActive(room.user)  

                resolve(null)
            }
        })
    }

    /**
     * Performs Endcrypt handshake
     * @param room initialized room object
     * @returns 
     */
    public async performHandShake(room: room){
        return new Promise((resolve: any, reject) => {

            if(room.isInitialized) resolve();
            //Send Handshake
            room.endcrypt.sendHandshake((publicKey: string) => {
                this.sendHandShake(this.auth.id,publicKey,room.user)
            }) 

            this.socket.once(`handshake-reply-${this.auth.id}-${room.user}`, (data) => {
                room.endcrypt.receiveHandshake(data.publicKey);
                room.isInitialized = true;
                resolve();
            })
        })
    }

    /**
     * Request the user list over the network and adds them to user list
     */
    private getUserList(){
        this.socket.emit("get-online-users", (users: {id: number, name: string, email: string}[]) => {
            this.addNewUsersToUserList(users);
        } )
    }

    /**
     * Updates the last time the user sent message
     * @param id the userid
     */
    private updateTimeInUserChatDetail(id: number) {

        let tempUser: userDetail | null = null;
        const temp = this.userList.filter(user => {
            if(user.id === id){
                user.updatedAt = new Date();
                tempUser = user;
                return false;
            }
            return true;
        })

        if(tempUser) this.setUserList([tempUser, ...temp])

    }

    /**
     * Finds and returns the user from userList
     * @param id userid
     * @returns user details
     */
    public getUserFromUserList(id: number): userDetail | null {
        for(let i=0; i < this.userList.length; i++){
            const user = this.userList[i];
            if(user.id === id) return user
        }
        return null;
    }

    /**
     * Adds new message to the users message list
     * @param parterid id of the partner
     * @param message initialized message object
     */
    public addNewMessage(parterid: number, message: message) {
        const newRooms = {...this.chatRoom};

        newRooms[parterid].messages.push(message);

        this.updateTimeInUserChatDetail(parterid);

        this.setchatRoom(newRooms);

        if(this.onRoomUpdate) this.onRoomUpdate(newRooms);
    }

    /**
     * Returns a new message
     * @param from the sender id
     * @param message the real message
     * @param time date string
     * @param id message id
     * @returns message
     */
    public createNewMessage(from: number, message: string, time?: string, id?: string) : message {
        if(!time) time = new Date().toString()
        if(!id) id = uuid();
        return {id,from,message,time}
    }

    /**
     * Destroys the previous encrypter and sets a new one
     * @param id room / user id
     */
    private destroyUserEncrypter(id: number){
        if(this.chatRoom[id]){
            const newRoom = {...this.chatRoom};
            newRoom[id].endcrypt = new Endcrypt();
            newRoom[id].isInitialized = false;
            this.setchatRoom(newRoom)
        }
    }

    /**
     * Returns a new room
     * @param user user id
     * @returns room
     */
    public createNewRoom(user:number): room {
        const id = uuid();
        return {id,user,endcrypt: new Endcrypt(),isInitialized: false, messages: []}
    }

    /**
     * Returns the room based on the user id
     * @param user user id
     * @returns room
     */
    public getRoomByUserId(user: number): room | null {
        return this.chatRoom[user];
    }

    /**
     * Adds new users to the userList
     * @param users user info
     */
    public addNewUsersToUserList(users: user[]) {
        const temp = users.map(user => this.createUserChatDetail(user, false, true));
        this.setUserList([...temp,...this.userList]);
    }

    /**
     * Add new user to the userList
     * @param user user info
     */
    public addNewUserDetail(user: user) {

        const isPresent = this.userList.find(u => u.id === user.id)

        if(isPresent){
            this.setUserOnline(user.id);
        } else {
            const newUser = this.createUserChatDetail(user, false, true)
            const newUserDetails = [...this.userList, newUser];
            this.setUserList(newUserDetails);
        }

    }

    /**
     * Sets a user as online
     * @param id user id
     */
    public setUserOnline(id: number) {
        const temp = this.userList.map(user => {
            if(user.id === id){
                user.isOnline = true;
            }
            return user;
        })
        this.setUserList(temp);
    }

    /**
     * set the user as offline
     * @param id user id
     */
    public setUserOffline(id: number) {
        const temp = this.userList.map(user => {
            if(user.id === id){
                user.isOnline = false;
            }
            return user;
        })
        this.setUserList(temp);
    }

    /*Chat Methods*/

    /**
     * Sends the message to the partner
     * @param room room object
     * @param message message object
     * @param to user id to whome to sent the message
     * @param cb callback triggerd when the message is forwarded by the server to recipient
     * @returns void
     */
    public async sendMessage(room: room, message: message, to: number, cb: Function){

        //Find the user from the userlist
        const user = this.getUserFromUserList(room.user);

        //Check if the user does not exists
        if(!user) return

        //Check if the user is offline
        if(!user.isOnline) return

        //perform the end-to-end handshake
        await this.performHandShake(room);
        
        //encrypt the message
        const encryptedText = room.endcrypt.encrypt(message.message);
    
        const encryptedMessage = {
            ...message,
            message: encryptedText
        } 
        
        //Send to the server
        this.socket.emit("new-message", {message: encryptedMessage,to}, cb);
    }

    /**
     * Listner for new message received
     */
    public setOnMessageReceivedListener() {
        this.socket.on("message-received", async (data) => {
            const message: message = data.message;
    
            let room: room | null = this.getRoomByUserId(message.from)
    
            //Check if the chat is already up
            if(!room) {
                //Create a new Room
                room = this.createNewRoom(message.from);
    
                //Add room to state
                await this.addRoom(room);
            }

            const tempMessage = {...message}
    
            const decryptedMessage = room.endcrypt.decrypt(message.message);
            tempMessage.message = decryptedMessage;

            this.addNewMessage(message.from,tempMessage);

            this.incrementUnread(message.from);
        })
    }

    /**
     * Sends a handshake to the partner
     * @param from user / room  of the sender
     * @param publicKey public key from endcrypt
     * @param to user / room of the receiver
     */
    public sendHandShake(from: number, publicKey: string, to: number) {
        this.socket.emit("start-handshake",{publicKey, from, to});
    }

    /**
     * Listener for when a handshake request is received
     */
    public setOnForwardedHandshakeEvent() {
    
        this.socket.on("forwarded-handshake", data => {
    
            let room: room | null = this.getRoomByUserId(data.from)
    
            if(!room) room = this.createNewRoom(data.from);
    
            room.endcrypt.receiveHandshake(data.publicKey);
    
            room.endcrypt.sendHandshake(async (publicKey: string) => {
                this.socket.emit("forwarded-handshake-reply",{publicKey, from: data.from, to: data.to})
                room!.isInitialized = true
                await this.addRoom(room!);
            })
    
        })
    
    }

    /**
     * Resets the user detail
     * @param id user id
     */
    private resetUser(id: number) {
        const users = this.userList.map(user => {
            if(user.id === id){
                user.unreadCount = 0;
                user.active = false;
            }
            return user;
        })

        this.setUserList(users);
    }

    /**
     * Destroys a room in chatroom
     * @param id user id
     * @returns 
     */
    public destroyRoom(id: number){
    
        const room = this.getRoomByUserId(id);

        if(!room) return

        const newRoom: roomDictionary = {}

        for(const [key, value] of Object.entries(this.chatRoom)){
            const IntKey = parseInt(key)
            if(IntKey !== id){
                newRoom[IntKey] = value;
            }
        }

        this.setchatRoom(newRoom);

        this.resetUser(id);
        
    }

    /**
     * Used to send all the messages that are with user and the partner after the handshake.
     * This is done as after a browser refresh the chat state and private key is lost on that end, and so the
     * other side needs to reinstate those from its own state for proper chatting
     * @param id user id
     * @returns void
     */
    private async repopulateChat(id: number){

        const room = this.getRoomByUserId(id);

        if(!room) return;

        await this.performHandShake(room);

        const encryptedMessages = room.endcrypt.encrypt(JSON.stringify(room.messages));

        //Resend all the chat
        this.socket.emit("resend-all-chat", this.auth.id, id, encryptedMessages);

    }

    /**
     * Listener for message resends
     */
    private setOnMessageResend(){
        this.socket.on("forwarded-resend-all-chat", async (from,data) => {
            const room = await this.getRoomByUserId(from);

            if(room){
                const decryptedMessages = room.endcrypt.decrypt(data);
                const messages = JSON.parse(decryptedMessages);
                
                const newRooms = {...this.chatRoom};

                newRooms[from].messages = messages;

                this.updateTimeInUserChatDetail(from);

                this.setchatRoom(newRooms);

                this.setUserAsActive(from);

                if(this.onRoomUpdate) this.onRoomUpdate(newRooms);
            }

        })
    }

    /**
     * Listener for new user coming online
     */
    private setOnNewUserOnline(){
        this.socket.on("new-user-online", (data: user) => {
            this.addNewUserDetail(data);
            this.repopulateChat(data.id);
        })
    }

    /**
     * Listener for existing user going offline
     */
    private setOnUserGoOffline(){
        this.socket.on("user-go-offline", (id: number) => {
            this.setUserOffline(id);
            this.destroyUserEncrypter(id);
        })
    }

    /**
     * @override Overide this know of room updates
     */
    public onRoomUpdate: onRoomUpdateDef | null = null;

}



//@ts-expect-error
export const ChatContext = createContext<{
    chatRoom: roomDictionary,
    userList: userDetail[],
    currentActiveChat: currentActiveUserDef | null
    chatConnection: ChatConnection | null,
    connectChatConnection: (auth: authProfile,socket: Socket) => void,
    destroyChatInfo: () => void
}>();

/**
 * Context Provider that provides the chat resource context to its childrens
 */
const ChatContextProvider: React.FunctionComponent<ChatContextProviderProps> = ({children}) => {

    const [chatRoom, setchatRoom] = useState<roomDictionary>({});

    const [userList, setUserList] = useState<userDetail[]>([]);

    const [currentActiveChat, setCurrentActiveChat] = useState<currentActiveUserDef | null >(null);

    const [chatConnection, setChatConnection] = useState<ChatConnection | null>(null)

    const connectChatConnection = (auth: authProfile, socket: Socket) => {
        setChatConnection(new ChatConnection(
            auth, socket, chatRoom, userList, currentActiveChat,
            setchatRoom, setUserList, setCurrentActiveChat
        ))
    }

    const destroyChatInfo = () => {
        setchatRoom({});
        setUserList([]);
        setCurrentActiveChat(null);
        setChatConnection(null)
    }

    return (
        <ChatContext.Provider value={{
            chatRoom, userList, currentActiveChat,
            chatConnection, connectChatConnection, destroyChatInfo
        }}>
        {children}
        </ChatContext.Provider>
    );
}
 
export default ChatContextProvider;