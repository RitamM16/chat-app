import {
    AppBar, 
    Button, 
    createStyles, 
    makeStyles, 
    Theme, 
    Toolbar, 
    Typography, 
    Box,
    IconButton,
    Menu,
    MenuItem,
    Divider
} from "@material-ui/core"
import { useHistory } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { useContext, useState } from "react";
import AccountCircle from "@material-ui/icons/AccountCircle";
import { ChatContext } from "../Context/ChatContext";
import { CallContext } from "../Context/CallContext";
import {SocketContext} from "../Context/SocketContext";

export interface NavBarProps {}

const useStyles = makeStyles((theme: Theme) => 
    createStyles({
        root: {
            flexGrow: 1,
        },
        title: {
            flexGrow: 1,
        },
    })
)
 
const NavBar: React.FunctionComponent<NavBarProps> = () => {

    const classes = useStyles();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const open = Boolean(anchorEl);

    const {auth, logout} = useContext(AuthContext);

    const {destroyChatInfo} = useContext(ChatContext);

    const {setCallConnections} = useContext(CallContext);

    const {socket, setSocket} = useContext(SocketContext);

    const history = useHistory();

    const handleLogout = () => {
        setCallConnections(null);
        destroyChatInfo();
        socket?.disconnect();
        setSocket(null);
        logout();
    }

    const handlePress = (to: string) => {
        history.push(to);
    }

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const notAuthenticatedTemplate = (
        <div>
            <Button color="inherit" onClick={()=>handlePress("/login")}>
                Login
            </Button>
            <Button color="inherit" onClick={()=>handlePress("/signup")}>
                Signup
            </Button>
        </div>
    )

    const AuthenticatedTemplate = (
        <div>
            <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
            >
            <AccountCircle />
            </IconButton>
            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
            >
            <div style={{paddingLeft: "15px", paddingRight: "15px", paddingTop: "5px", paddingBottom: "7px", fontSize:"17px", fontWeight: "bold"}}>{auth && auth.name}</div>
            <Divider variant="middle"/>
            <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
        </div>
    )

    if(!auth){
        if(anchorEl) setAnchorEl(null)
    }

    return (
        <Box className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h5" className={classes.title}>
                        Chat Application
                    </Typography>
                    {auth ? AuthenticatedTemplate : notAuthenticatedTemplate}
                </Toolbar>
            </AppBar>
        </Box>
    );
}
 
export default NavBar;