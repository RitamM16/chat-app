import React, { useContext, useRef , useState} from "react";
import NewWindow from "react-new-window";
import { CallConnections, CallContext } from "../../Context/CallContext";
import CallerModal from "./CallerModel";
import CallerReceiver from "./CallerReceiver";
import CallScreen from "./CallScreen";

export interface VideoCallProps {
    title: string, callConnection: CallConnections
}
 
/**
 * A Component that is used for displaying video call
 */
const VideoCall: React.FunctionComponent<VideoCallProps> = ({title, callConnection}) => {

    const {callState} = useContext(CallContext);

    return (
        <div>
            {callState !== "idel" && <CallerModal callState={callState} onClose={() => {}} name={callConnection.callData!.name} onHangUp={() => callConnection.endCall()}/>}
            {callState !== "idel" && <CallerReceiver callState={callState} onClose={() => {}} name={callConnection.callData!.name} onAccept={() => callConnection.answerCall()} onReject={() => callConnection.endCall()}/>}
            {callState === "oncall" &&<NewWindow 
                title={`Video call by ${callConnection.callData?.name}`}
                onUnload={()=>callConnection.endCall()}
                onBlock={() => console.log("Blocked")}
                center="screen"
            >
                <CallScreen callConnection={callConnection}/>
            </NewWindow>}
        </div>
    )
}
 
export default VideoCall;