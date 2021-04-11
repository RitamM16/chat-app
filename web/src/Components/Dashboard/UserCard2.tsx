import { Avatar,ButtonBase, Badge, Box, Card, createStyles, makeStyles, Typography, withStyles, IconButton } from "@material-ui/core";
import React from "react";
import { userDetail } from "../../Context/ChatContext";
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import CancelIcon from '@material-ui/icons/Cancel';

export interface UserCardProps {
    user: userDetail,
    selectChat: (id: number, name: string) => void,
    handleChatDelete: (id:number ) => void
}

const useStyles = makeStyles((theme) =>
  createStyles({
    avatar: {
        width: "50px",
        minHeight: "50px",
        marginLeft: "5px",
    },
    card: {
        marginRight: "10px",
        marginLeft: "10px",
        marginBottom: "5px",
    },
    typoBox: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%",
    }
  }),   
);

const StyledBadge = withStyles((theme) =>
  createStyles({
    badge: {
      right: 5,
      top: 5,
      border: `2px solid ${theme.palette.background.paper}`,
      padding: '0 4px',
    },
  }),
)(Badge);
 
 
const UserCard: React.FunctionComponent<UserCardProps> = ({user, selectChat, handleChatDelete}) => {
    
    const classes = useStyles();
    
    const template = (
        <React.Fragment>
            <Box display="flex" alignItems="center"  paddingLeft="2px" paddingRight="0px" marginRight="5px" minWidth="0" width="100%" minHeight="70px">
                    {
                        user.isOnline ? 
                        (<StyledBadge color="primary" badgeContent={user.unreadCount} max={999}>
                            <Avatar className={classes.avatar}>{user.name[0]}</Avatar>
                        </StyledBadge>) :
                        <IconButton style={{height: "50px", width: "50px", marginLeft: "5px"}} onClick={() => handleChatDelete(user.id)}>
                            <CancelIcon style={{fontSize:"58px"}} color="action"/>
                        </IconButton>
                    }
                    <Box display="flex" flexDirection="column" alignItems="start" marginLeft="10px" minWidth="0" paddingRight="3px" width="100%">
                        <Box display="flex" alignItems="flex-start" height="100%" width="100%" >
                            <Box textAlign="start" paddingLeft="4px">
                                <Typography color="textSecondary">
                                    {user.name}
                                </Typography>
                            </Box>
                            <Box textAlign="start" paddingTop={user.isOnline ? "6px" : "1px"} paddingLeft="3px">
                                <FiberManualRecordIcon style={{fontSize: "5px"}} color="action"/>
                            </Box>
                            <Box flexGrow={1} textAlign="start" paddingLeft="3px">
                                <Typography style={{color: user.isOnline ? "green" : "red"}}>
                                    {user.isOnline ? "Online" : "Offline"}
                                </Typography>
                            </Box>
                            <Box justifySelf="flex-end" paddingTop={user.isOnline ? "4px" : "0px"} paddingRight={user.isOnline ? "0px" : "7px"}>
                                <Typography variant="caption" display="initial"> 
                                    {user.updatedAt.toLocaleTimeString('en-US',{ hour: '2-digit', minute: '2-digit'})}
                                </Typography>
                            </Box>
                        </Box>
                        <Box textAlign="start" paddingLeft="4px" width="100%">
                            <Typography className={classes.typoBox}>
                                {user.email}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
        </React.Fragment>
    )

    return (
        <Card className={classes.card} variant="outlined">
            {
                user.isOnline ? (
                    <ButtonBase style={{width: '100%'}} onClick={() => selectChat(user.id, user.name)}>
                        {template}
                    </ButtonBase> 
                ) : (template)
            }
        </Card>
    )
}
 
export default UserCard;