import { createStyles, Divider, Grid, makeStyles, Theme } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import Chat from "./Chat";
import { ChatContext, userDetail } from "../../Context/ChatContext";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../Context/AuthContext";
import CircularProgress from '@material-ui/core/CircularProgress';
import { connectToServer, SocketContext } from "../../Context/SocketContext";
import { CallContext } from "../../Context/CallContext";
import VideoCall from "../VideoCall/VideoCall";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React from "react";
import UserCard from "./UserCard2"
import { Redirect } from "react-router-dom";

export interface DashboardProps {}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
        height: "100%"
    },
    paper: {
        display: "flex",
        textAlign: "center",
        color: theme.palette.text.secondary,
        height: "100%",
        backgroundColor: "white",
    },
    sideBar: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "white",
        boxShadow: "3px 1px #ccc",
        maxWidth: "450px"
    },
    textField: {
        marginTop: "10px",
        width: "100%",
        marginLeft: "10px",
        marginRight: "10px"
    },
    overFlowBox: {
        overflow: "auto",
        display: "flex",
        flexDirection:"column",
        alignItems: "stretch",
        height: "100%"
    }
  }),
);

export interface userProfile {
    email: string,
    name: string,
    id: number
}

const Dashboard: React.FunctionComponent<DashboardProps> = () => {

    const classes = useStyles();

    const {chatConnection, userList, currentActiveChat, connectChatConnection} = useContext(ChatContext);
    const {socket, setSocket} = useContext(SocketContext);
    const { auth } = useContext(AuthContext);
    const { callConnection, setCallConnections} = useContext(CallContext);

    const [searchValue, setSearchValue] = useState<userProfile | null>(null);
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<userDetail[]>([]);

    /**
     * handleChatStart makes sure that the chat room is initialized before any chat activity happens
     * @param partnerid The id number for whom the chat is to be initialized
     * @returns room
     */
    const handleChatStart = async (partnerid: number) => {

        if(!auth) throw Error("Auth not set")

        if(!chatConnection) throw new Error("Chat connection not set")

        let room = null;

        room = chatConnection.getRoomByUserId(partnerid);
       
        if(!room){

            //Create new room
            room = chatConnection.createNewRoom(partnerid);

            await chatConnection.addRoom(room);
        }

        return room;

    }

    /**
     * setChat is used to set the unread counter to 0 and set the room as current
     * @param id room / user ID
     * @param name Name of the user
     */
    const setChat = (id: number, name: string) => {

        if(!chatConnection) throw new Error("Chat connection not set")

        const room = chatConnection.getRoomByUserId(id);

        if(room){
            chatConnection.setUnreadToZeroAndSetAsCurrent(id,name)
        }

    }

    /**
     * handleSendNewMessage is used for sending message to the currently active user
     * @param partnerid user / room ID
     * @param message message that needs to be sent
     * @returns void
     */
    const handleSendNewMessage = async (partnerid: number, message: string) => {

        if(message === "") return;

        if(!chatConnection) throw Error("Chat Connection not set");

        const room = await handleChatStart(partnerid);

        if(auth){
            const newMessage = chatConnection.createNewMessage(auth.id, message);

            if(socket && chatConnection)
            await chatConnection.sendMessage(room,newMessage, partnerid, (data: boolean) => {
                //Wait for the socket connection to confirm the delivery
                if(data) chatConnection.addNewMessage(partnerid,newMessage);
                chatConnection.setCurrentActiveChat({...currentActiveChat!});
            })
        }
    }

    /**
     * Removes the user room from the chatRoom, and sets the user as inactive
     * @param id room / user Id
     */
    const handleChatDelete = (id: number) => {
        if(chatConnection) chatConnection.destroyRoom(id);
    }

    useEffect(() => {
        if(!socket && auth){
            let client = connectToServer(auth.id);
            
            //Once connected to server, initialize all the features
            client.once("connected",() => {
                console.log("connected")
                setSocket(client);
                setCallConnections(client);
                connectChatConnection(auth,client);
            })
        }

    },[])

    useEffect(() => {

        //Updates the currentActiveChat on selection of a user in search box
        if(searchValue && chatConnection){
            chatConnection.setCurrentActiveChat({
                title: searchValue?.name,
                userid: searchValue?.id,
            });
        }
        
    },[searchValue])

    useEffect(() => {

        //Updaing users to the one without the users profile itself
        const newList = userList.filter(user =>{

            //If same user then skip
            if(user.id === auth?.id) return false;

            return true;
        })

        setUsers(newList)

    },[userList])


    if(!auth) return <Redirect to="/login"/>
    return (
            <Box component="div" height="100%">
                {callConnection && <VideoCall title="Ritam" callConnection={callConnection}/>}
                <Grid className={classes.paper} container spacing={0}>
                    <Grid className={classes.sideBar} item xs={5}>
                        <div style={{paddingRight: "10px", paddingLeft: "10px", paddingTop: "10px"}}>
                            <Autocomplete
                                id="User Search"
                                style={{ }}
                                open={open}
                                onOpen={() => {
                                    setOpen(true);
                                }}
                                onClose={() => {
                                    setOpen(false);
                                }}
                                onChange={(event, newValue) => setSearchValue(newValue as userProfile)}
                                getOptionSelected={(option, value) => option.name === value.name}
                                getOptionLabel={(option) => option.name}
                                options={users.filter(user => user.isOnline)}
                                loading={userList.length === 0}
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    label="Search Users"
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                        <React.Fragment>
                                            {userList.length === 0 ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                        ),
                                    }}
                                    />
                                )}
                            />
                        </div>
                        <Divider style={{marginTop: "8px"}} variant="fullWidth"/>
                        <Box className={classes.overFlowBox} textAlign="center" paddingTop={1}>
                            {users.filter(user => user.active).map(user => {
                                return <UserCard key={user.id} user={user} selectChat={setChat} handleChatDelete={handleChatDelete}/>
                            })}
                        </Box>
                    </Grid>
                    <Grid item xs>
                    {
                        currentActiveChat === null ? 
                            <Box paddingTop={3}>No Chat selected</Box> :
                            <Chat 
                                title={currentActiveChat.title} 
                                roomid={currentActiveChat.userid} 
                                handleNewMessage={handleSendNewMessage} 
                                callToPartner={() => callConnection?.call(auth!.name, currentActiveChat.userid , currentActiveChat.title)}/>
                    }
                    </Grid>
                </Grid>
            </Box>
    );
}
 
export default Dashboard;