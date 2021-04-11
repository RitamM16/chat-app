import { Dialog, DialogTitle, Typography, Grid } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import CallEndIcon from '@material-ui/icons/CallEnd'; 
import { useState } from "react";

export interface CallerModalProps {
    callState: string,
    onClose: () => void,
    name: string,
    onHangUp: () => void
}
 
/**
 * A component that displays the info of the one being being called,
 * and the controls for ending the call.
 */
const CallerModal: React.FunctionComponent<CallerModalProps> = ({
    callState, onClose, name, onHangUp
}) => {

    const [open, setOpen] = useState(false);

    //Depending on the call state the dialog opens or closes
    if(callState === "outgoing") {
        if(!open) setOpen(true);
    } else {
        if(open) setOpen(false);
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <div style={{minHeight: "100px", width: "300px"}}>
                <div style={{padding: "20px"}}>
                    <Grid container>
                        <Grid item xs>
                            <Typography variant="h5" style={{fontWeight: "bold"}}>
                                Calling {name}
                            </Typography>
                            <Typography>
                                Ringing...
                            </Typography>
                        </Grid>
                        <Grid item style={{backgroundColor: "red", height:"50px", width:"50px", borderRadius: "50%", padding: "1px"}}>
                            <IconButton style={{color: "white"}} onClick={onHangUp}>
                                <CallEndIcon/>
                            </IconButton>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </Dialog>
    );
}
 
export default CallerModal;