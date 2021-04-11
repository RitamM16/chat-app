import { Grid, Theme } from "@material-ui/core";
import { makeStyles, createStyles } from "@material-ui/styles";
import { useRef, useState, useEffect, useContext } from "react";
import IconButton from "@material-ui/core/IconButton";
import CallEndIcon from '@material-ui/icons/CallEnd';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { CallConnections } from "../../Context/CallContext";
import SimpleAudio from "./Audio";
import { AuthContext } from "../../Context/AuthContext";
//import ReactAudioPlayer from "react-audio-player";

export interface CallScreenProps {
    callConnection: CallConnections
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    rootGrid: {
        backgroundColor: "yellow", height: "100%"
    },
    partnerVideo: {
        height: "100%", width: "100%",
    },userVideo: {
        height: "120px",
        width: "200px",
        position: "absolute",
        bottom: "60px",
        right: "5px"
    },
    buttonGrid: {backgroundColor: "#3F51B5", height: "55px"},
    buttonDiv: {display: "flex", justifyContent: "center", paddingTop: "5px"},
    callEndButton: {'&:hover': { backgroundColor: "#be0000", color: "#F5F5F5"},}
}))
 
const CallScreen: React.FunctionComponent<CallScreenProps> = ({callConnection}) => {

    const classes = useStyles();
 
    //Authentication info
    const { auth } = useContext(AuthContext);

    //Video element references
    const userVideoRef = useRef<HTMLVideoElement>() as React.RefObject<HTMLVideoElement>;
    const partnerVideoRef = useRef<HTMLVideoElement>() as React.RefObject<HTMLVideoElement>;

    //Component states
    const [partnerAudioStream, setPartnerAudioStream] = useState<MediaStream | null>(null);
    const [isPartnerVideoOn, setIsPartnerVideoOn] = useState(true);

    //Media controls for voice and video
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);

    /**
     * This method is fired when a audio stream arrives from the partner
     * @param stream Audio stream of the partner
     */
    callConnection.onAudioStream = (stream: MediaStream) => {
        setPartnerAudioStream(stream)
    }

    /**
     * This method is fired when a video stream arrives from the partner
     * @param stream Video stream of the partner
     */
    callConnection.onVideoStream = (stream: MediaStream) => {
        setIsPartnerVideoOn(true);
        partnerVideoRef.current!.srcObject = stream;
    }

    /**
     * This method is fired when a video stream is created for the user itself
     * @param stream Video stream of the user itself
     */
    callConnection.onUserVideo = (stream: MediaStream) => {
        userVideoRef.current!.srcObject = stream;
    }

    /**
     * This method is fired when the partner turns their video off
     */
    callConnection.onVideoClosed = () => {
        setIsPartnerVideoOn(false);
    }
 
    const handleToogleMute = () => {
        if(muted){
            //Unmute
            setMuted(false);
            callConnection.unMuteAudio();
        }else{
            //Muted
            setMuted(true)
            callConnection.muteAudio();
        }
    }

    const handleVideoToogle = () => {
        if(videoOff){
            //Unmute
            setVideoOff(false);
            callConnection.startVideo();
        }else{
            //Muted
            setVideoOff(true)
            callConnection.endVideo();
        }
    }

    //video template for when the video is turned off
    const videoOffTemplate = (name: string, height: string, width: string, color: string) => (
        <div style={{height, width, backgroundColor: "black", display: "grid", placeItems: "center"}}>
            <div style={{
                backgroundColor: color,
                color: "white",
                height: "60px",
                width: "60px",
                borderRadius: "50px",
                display: "grid",
                placeItems: "center",
                paddingRight: "2px",
                paddingBottom: "2px"
            }}>
                <div style={{fontSize: "30"}}>{name[0]}</div>
            </div>
        </div>
    )

    useEffect(() => {

        //Attach User Video
        if(callConnection.userVideo && userVideoRef.current){
            userVideoRef.current.srcObject = callConnection.userVideo;
        }

        //Attach Partner Video
        if(callConnection.partnerVideo && partnerVideoRef.current){
            partnerVideoRef.current.srcObject = callConnection.partnerVideo;
        }

    }, [])

    return (
        <Grid className={classes.rootGrid} style={{backgroundColor: "black", height: "100%"}} container direction="column" justify="flex-end" alignItems="stretch">
            <Grid item xs>
                {partnerAudioStream && 
                    // <audio ref={partnerAudioRef} onCanPlay={onCanPlay} controls autoPlay playsInline></audio>
                    <SimpleAudio audioSrc={partnerAudioStream}/>
                }
                {
                    isPartnerVideoOn ? 
                    <video className={classes.partnerVideo} style={{height: "100%", width: "100%", position: "relative"}} ref={partnerVideoRef} autoPlay playsInline muted/>:
                    videoOffTemplate(callConnection.callData!.name, "100%", "100%","orange")
                }
                <div style={{
                    position: "absolute",
                    bottom: "60px",
                    right: "5px",
                }}>
                    {videoOff ? 
                        videoOffTemplate(auth!.name, "120px","200px", "green"):
                        <video style={{ height: "120px",width: "200px",}} className={classes.userVideo} ref={userVideoRef} autoPlay playsInline muted/>
                    }
                </div>
            </Grid>
            <Grid className={classes.buttonGrid} style={{backgroundColor: "#3F51B5", height: "55px"}} item >
                <div className={classes.buttonDiv} style={{display: "flex", justifyContent: "center", paddingTop: "5px"}}>
                    <IconButton onClick={() => handleToogleMute()}>
                        {muted ? <MicOffIcon/>:<MicIcon/>}
                    </IconButton>
                    <IconButton onClick={() => handleVideoToogle()}>
                        {videoOff ? <VideocamOffIcon/>:<VideocamIcon/>}
                    </IconButton>
                    <IconButton className={classes.callEndButton} onClick={() => callConnection.endCall()}>
                        <CallEndIcon/>
                    </IconButton>
                </div>
            </Grid>
        </Grid>
    );
}
 
export default CallScreen;