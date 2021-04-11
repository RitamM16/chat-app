import { Dialog, DialogTitle, Typography, Grid } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import CallEndIcon from '@material-ui/icons/CallEnd'; 
import { useState } from 'react';

export interface CallerModalProps {
    callState: string,
    onClose: () => void,
    name: string
    onAccept: () => void,
    onReject: () => void
}
 
/**
 * A Component that is used by the receiver of a video call to show caller info and accept or reject a call
 */
const CallerReceiver: React.FunctionComponent<CallerModalProps> = ({
    callState, onClose, name, onAccept, onReject
}) => {

    const [open, setOpen] = useState(false);

    if(callState === "incoming") {
        if(!open) setOpen(true);
    } else {
        if(open) setOpen(false);
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <div style={{minHeight: "100px", minWidth: "500px", maxWidth: "700px"}}>
                <div style={{padding: "20px"}}>
                    <Grid container>
                        <Grid item xs style={{paddingRight: "30px"}}>
                            <Typography variant="h5" style={{fontWeight: "bold"}}>
                                Incoming call from {name}
                            </Typography>
                            <Typography>
                                Ringing...
                            </Typography>
                        </Grid>
                        <Grid item style={{backgroundColor: "green", height:"50px", width:"50px", borderRadius: "50%", padding: "1px"}}>
                            <IconButton style={{color: "white"}} onClick={onAccept}>
                                <CallEndIcon/>
                            </IconButton>
                        </Grid>
                        <Grid item style={{backgroundColor: "red", height:"50px", width:"50px", borderRadius: "50%", padding: "1px", marginLeft:"10px"}}>
                            <IconButton style={{color: "white"}} onClick={onReject}>
                                <CallEndIcon/>
                            </IconButton>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </Dialog>
    );
}
 
export default CallerReceiver;