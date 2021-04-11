import Peer from "peerjs";
import { createContext, useState } from "react";
import { Socket } from "socket.io-client";

//Possible call states
export type callStateTypes = "oncall" | "incoming" | "outgoing" | "idel";

//@ts-expect-error
export const CallContext = createContext<{
    callState: "oncall" | "incoming" | "outgoing" | "idel",
    callConnection: CallConnections | null,
    setCallConnections: (socket: Socket | null) => void
}>();

export interface CallContextProviderProps {}

/**
 * This class defines all the state and methods that will be needed during a video call
 */
export class CallConnections {

    //All connection objects
    public socket: Socket;
    private peerForAudio: Peer | null = null;
    private outGoingVideoPeer: Peer | null = null;
    private incomingVideoPeer: Peer | null = null;

    //All Media Stream sources
    private userAudio: MediaStream | null = null;
    public partnerAudio: MediaStream | null = null;
    public userVideo: MediaStream | null = null; 
    public partnerVideo: MediaStream | null = null; 

    //Data connection object for peer-to-peer exchange
    private dataConn: Peer.DataConnection | null = null;

    //All Call objects that maintain the call session
    private outGoingVideoCall: Peer.MediaConnection | null = null;
    private incomingVideoCall: Peer.MediaConnection | null = null;

    public callState: callStateTypes;
    public setCallState: (value: callStateTypes) => void;

    //Holds all the relevent data regarding the call
    public callData: {name: string, audioId: string, videoId: string} | null = null;


    constructor(socket: Socket, callState: callStateTypes, setCallState: (value: callStateTypes) => void){
        this.socket = socket;

        this.callState = callState;
        this.setCallState = (value: callStateTypes) => {
            this.callState = value;
            setCallState(value)
        };

        //Initializer for Incoming Call
        this.setOnIncomingCall();
    }

    /**
     * A light wrapper over the getUserMedia() method
     * @param contraints The media source
     * @returns MediaStream wrapped in promise
     */
    private async getMediaStream(contraints: MediaStreamConstraints): Promise<MediaStream>{
       return window.navigator.mediaDevices.getUserMedia(contraints);
    }

    /**
     * @returns a new Peer object all initialized
     */
    private newPeer(){
        return new Peer({
            host: '/',
            port: 8000,
            path: "/call"
        })
    }

    /**
     * Initializes all the peer objects for the call;
     * @returns void
     */
    public async initPeers(){

        console.log("Peer init start")

        //Check if any peer is already intialized, if yes then abort
        if(this.peerForAudio && this.incomingVideoPeer && this.outGoingVideoPeer) return

        this.peerForAudio = this.newPeer();
        this.outGoingVideoPeer = this.newPeer();
        this.incomingVideoPeer = this.newPeer();

        
        const promise = [
            new Promise((resolve: any, reject) => this.peerForAudio!.on("open", id => {
                resolve()
            })),
            new Promise((resolve: any, reject) => this.outGoingVideoPeer!.on("open", id => {
                resolve()
            })),
            new Promise((resolve: any, reject) => this.incomingVideoPeer!.on("open", id => {
                resolve()
            })),
        ]

        //Wait for all the peer to connect to the server
        await Promise.all(promise);

        console.log("peer initialized")
        //Initialize all the video peer listeners
        this.setAllVideoPeerListeners();
    }

    /**
     * Initiates a video call
     * @param callerName name of the user that calls
     * @param userid id of the user to call
     * @param userName name of the user to call
     */
    public async call(callerName: string, userid: number, userName: string){
        //Initialize Peer;
        await this.initPeers();

        //set the call data
        this.callData = {name: userName, audioId: "", videoId: ""};

        //update the call state 
        this.setCallState("outgoing");

        /**
         * Sending the peer ids of the user that wants to call to the user that is supposed to recieve the call.
         * The reciever of the peer id will actually call using these peer ids.
         */
        this.socket.emit("sending-peerid", {
            from: callerName,
            to: userid,
            peerAudioId: this.peerForAudio!.id,
            peerVideoId: this.incomingVideoPeer!.id
        })

        //On receiving a data only connection, set to the dataconn and initialize all the listeners
        this.peerForAudio!.on("connection", conn => {
            this.dataConn = conn;
            this.setOnDataComms();
        })

        //Set all audio only listeners
        this.setAllAudioPeerListeners();
    };
    
    /**
     * Used to answer a video call initiated by the partner
     * @returns void
     */
    public async answerCall() {

        //If the call data is not set, then return
        if(!this.callData) return;

        //Only answer the call if the call state is incoming
        if(this.callState === "incoming"){

            //Call the audio channel
            this.userAudio = await this.getMediaStream({audio: true})
            const audioCall = this.peerForAudio!.call(this.callData.audioId, this.userAudio);

            //When a media stream is recieved from partner
            audioCall.on("stream", stream => {
                this.setCallState("oncall");
                this.onAudioStream(stream);
                this.partnerAudio = stream;
            });
            
            //Connect for data communication
            this.dataConn!.send({type: "id", payload: this.incomingVideoPeer!.id});

            //Call the video channel
            await this.callWithVideo();
        }
    }

    /**
     * Gets the user video stream and makes a call, and video call object to outgoing video call reference
     */
    private async callWithVideo(){
        this.userVideo = await this.getMediaStream({video: true});
        this.outGoingVideoCall = this.outGoingVideoPeer!.call(this.callData!.videoId, this.userVideo);
        this.onUserVideo(this.userVideo);
    }


    /**
     * Used to stop the user video from user call controls
     */
    public async endVideo(){
        //Disconnect video from the peer
        this.outGoingVideoCall && this.outGoingVideoCall.close();
        this.userVideo && this.userVideo.getVideoTracks().forEach(track => track.stop()); 
        this.userVideo = null;
        this.outGoingVideoCall!.close();
        this.outGoingVideoCall = null;
        this.dataConn && this.dataConn.send({type: "videoEnd"})
    }

    /**
     * Used to start the video from the user video controls
     * @returns void
     */
    public async startVideo(){

        if(this.outGoingVideoCall) return;

        await this.callWithVideo();
    }

    /**
     * Used to completely stop all media tracks of a media stream
     * @param stream any media stream
     */
    private stopMediaTracks(stream: MediaStream){
        stream.getTracks().forEach(track => track.stop());
    }

    /**
     * Used to end the call
     * @param dontSendEndSingnal Used to specify whether if the call end signal is to be sent to the partner or not
     * @returns void
     */
    public endCall(dontSendEndSingnal?:boolean) {

        if(this.callState === "idel") return

        //Send call end signal to the partner if mentioned
        if(this.dataConn && dontSendEndSingnal === undefined) this.dataConn.send({type: "endCall"});

        //Set call state to idel
        this.setCallState("idel");


        /**
         * Destroy all media streams
         */
        if(this.userAudio){
            this.stopMediaTracks(this.userAudio);
            this.userAudio = null;
        }

        if(this.partnerAudio){
            this.stopMediaTracks(this.partnerAudio);
            this.partnerAudio = null;
        }

        if(this.userVideo){
            this.stopMediaTracks(this.userVideo);
            this.userVideo = null;
        }

        if(this.partnerVideo){
            this.stopMediaTracks(this.partnerVideo);
            this.partnerVideo = null;
        }


        /**
         * Destroy all Peer and call objects
         */
        if(this.incomingVideoPeer){

            this.incomingVideoCall?.close();
            this.incomingVideoCall = null;

            this.incomingVideoPeer.destroy();
            this.incomingVideoPeer = null;
            
        }
        if(this.outGoingVideoPeer){

            this.outGoingVideoCall?.close();
            this.outGoingVideoCall = null;

            this.outGoingVideoPeer.destroy();
            this.outGoingVideoPeer = null;
        }

        /**
         * Using a delay so that the data channel is not torn down before the call end signal is sent and received
         */
        setTimeout(() => {
            if(this.dataConn){
                this.dataConn.close();
                this.dataConn = null;
            }
    
            if(this.peerForAudio){
                this.peerForAudio.destroy();
                this.peerForAudio = null;
            }
        },1000);

        this.callData = null;

        //Releases all the listners
        this.resetAllListners();

        this.onCallEnd();
    }

    /**
     * Used to mute user audio
     */
    public muteAudio(){
        if(this.userAudio){
            this.userAudio.getTracks().forEach(track => track.enabled = false)
        }
    }

    /**
     * Used to unmute user audio
     */
    public unMuteAudio(){
        if(this.userAudio){
            this.userAudio.getTracks().forEach(track => track.enabled = true)
        }
    }

    /**
     * Used to set all the audio related listeners
     */
    private setAllAudioPeerListeners() {
        this.setOnConnectAudio();
        this.setOnCallClose()
    }

    /**
     * Used to set all the video related listeners
     */
    private setAllVideoPeerListeners() {
        this.setOnConnectVideo();
        this.setOnPartnerVideoClose();
    }

    /**
     * Listener for listen for incoming calls
     */
    private setOnIncomingCall(){
        this.socket.on("forwarded-calling",async data => {
            this.callData = {name: data.from, audioId: data.peerAudioId, videoId: data.peerVideoId}
            await this.initPeers();
            this.setCallState("incoming");
            this.dataConn = this.peerForAudio!.connect(this.callData.audioId);
            this.setOnDataComms();
        });
    }

    /**
     * Listener for waiting for the audio call to come through
     */
    private setOnConnectAudio(){
        this.peerForAudio!.on("call",async call => {
            this.userAudio = await this.getMediaStream({audio: true})
            call.answer(this.userAudio!);
            call.on("stream", partnerstream => {
                this.setCallState("oncall");
                this.onAudioStream(partnerstream);
                this.partnerAudio = partnerstream;
            });
            this.callData!.audioId = call.peer;
        })
    }

    /**
     * Listener for waiting for the video call to come through
     */
    private setOnConnectVideo(){
        this.incomingVideoPeer!.on("call",async call => {
            this.incomingVideoCall = call;
            call.answer();
            call.on("stream", stream => {
                this.partnerVideo = stream;
                this.onVideoStream(stream);
            });
            this.incomingVideoCall.on("close", () => {
                console.log("Video Closed")
                this.onVideoClosed();
            })
        })
    }

    /**
     * Listener for data for the data connection to come through
     */
    private setOnDataComms(){
        this.dataConn?.on("data", data => {
            console.log("Got the data:", data)
            if(data.type === "id"){
                this.callData!.videoId = data.payload;
                this.callWithVideo();
            }

            if(data.type === "videoEnd"){
                this.onVideoClosed();
            }

            if(data.type === "endCall"){
                this.endCall(true);
            }

        })
    }

    /**
     * Listener for partner video close
     */
    private setOnPartnerVideoClose(){
        this.incomingVideoCall?.on("close", () => {
            this.onClosePartnerVideoStream();
        })
    }

    /**
     * Listener for call close
     */
    private setOnCallClose(){
        this.peerForAudio!.on("close", () => {
            console.log("call close")
            this.onCallEnd();
        })
    }

    /**
     * Resets all listeners
     */
    private resetAllListners(){
        this.onAudioStream = (audioStream: MediaStream) => {};
        this.onVideoStream = (videoStream: MediaStream) => {};
        this.onUserVideo = (videoStream: MediaStream) => {};
        this.onVideoClosed = () => {};
        this.onClosePartnerVideoStream = () => {};
    }

    /**
     * @override Override this method to get the audio stream when available
     * @param audioStream MediaStream
     */
    public onAudioStream = (audioStream: MediaStream) => {};

    /**
     * @override Override this method to get the audio stream when available
     * @param audioStream MediaStream
     */
    public onVideoStream = (videoStream: MediaStream) => {};

    /**
     * @override Override this method to get the user video stream when available
     * @param videoStream 
     */
    public onUserVideo = (videoStream: MediaStream) => {};

    /**
     * @override Override this method 
     */
    public onVideoClosed = () => {};

    public onClosePartnerVideoStream = () => {};

    public onCallEnd = () => {};
    
}
 
const CallContextProvider: React.FunctionComponent<CallContextProviderProps> = ({children}) => {

    //State that stores the call state
    const [callState, setCallState] = useState<"idel" | "oncall" | "incoming" | "outgoing">("idel");

    //State that stores the call resources
    const [callConnection, setCallConnection] = useState<CallConnections | null>(null);

    /**
     * Initializes the call resources
     * @param socket socket.io client 
     */
    const setCallConnections = (socket: Socket | null) => {

        if(socket === null){
            setCallConnection(null);
        }
        else{
            setCallConnection(new CallConnections(
                socket, callState, setCallState
            ))
        }
        
    }

    return (
        <CallContext.Provider value={{
            callState,
            callConnection,
            setCallConnections,
        }}>
            {children}
        </CallContext.Provider>
    );
}
 
export default CallContextProvider;