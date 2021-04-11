import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import ChatBubble from "./ChatBubble";
import { useState, useContext } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { ButtonBase, IconButton } from "@material-ui/core";
import Send from "@material-ui/icons/Send";
import { VideoCallRounded } from "@material-ui/icons";
import Box from "@material-ui/core/Box"
import { ChatContext } from "../../Context/ChatContext";

export interface ChatWindowProps {
    title: string,
    roomid: number,
    handleNewMessage: (partnerid: number, message: string) => void;
    callToPartner: () => void
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: "column"
    },
    box: {
        overflow: "auto",
        display: "flex",
        flexDirection:"column-reverse",
        alignItems: "stretch",
    },
    gridContainer: {
        flexGrow: 1,
        diplay: "flex",
        flexDirection: "column",
        minHeight: 0
    },
    grid: {
        height: "100%",
    },
    textField: {
        marginTop: "10px",
        marginLeft: "10px"
    },
    title: {
        textAlign: "left",
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText,
        fontWeight: "bold",
        height: "50px",
        paddingLeft: "20px"
    },
  }),
);
 
const ChatWindow: React.FunctionComponent<ChatWindowProps> = ({
    title,
    roomid,
    handleNewMessage,
    callToPartner
}) => {
    
    const classes = useStyles();

    //State of the textfield
    const [text, settext] = useState("");

    const {auth} = useContext(AuthContext);

    const {chatRoom,userList} = useContext(ChatContext);

    return (
        <div className={classes.root}>
            <Grid className={classes.gridContainer} container direction="column" justify="flex-end" alignItems="stretch">
                <Grid item className={classes.title}>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <div style={{paddingTop: "14px"}}>{title}</div>
                        <div style={{ paddingRight: "8px", paddingTop: "2px"}}>
                            <IconButton onClick={() => callToPartner()} disabled={!userList.find(user => user.id === roomid)?.isOnline}>
                                <VideoCallRounded/>
                            </IconButton>
                        </div>
                    </div>
                </Grid>
                <Grid item xs className={classes.box}>
                    {chatRoom && chatRoom[roomid] && chatRoom[roomid].messages.map(chat => {
                            return (
                                <ChatBubble
                                    key={chat.id}
                                    id={chat.id}
                                    direction={auth && chat.from === auth.id ? "right" : "left"}
                                    message={chat.message}
                                />
                            )
                    })}
                </Grid>
                <Grid item style={{marginRight: "20px", height: "75px"}}>
                    <Box display="flex">
                        <Box flexGrow={1}>
                            <TextField 
                                    value={text} 
                                    className={classes.textField} 
                                    onChange={e => settext(e.target.value)} 
                                    label="Enter Message" variant="outlined" 
                                    onKeyPress={e => {
                                        if(e.key === "Enter"){ 
                                            handleNewMessage(roomid, text);
                                            settext("");
                                    }
                                }} fullWidth disabled={!userList.find(user => user.id === roomid)?.isOnline}/>
                        </Box>
                        <Box paddingLeft="20px" marginTop="14px">
                            <ButtonBase disableRipple onClick={() => { 
                                    handleNewMessage(roomid, text);
                                    settext("");
                                }}>
                                <Send style={{fontSize: 45}} />
                            </ButtonBase>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
 
export default ChatWindow;