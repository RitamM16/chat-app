import { useEffect, useRef } from "react";

export interface SimpleAudioProps {
    audioSrc: MediaStream | null
}
 
const SimpleAudio: React.FunctionComponent<SimpleAudioProps> = ({audioSrc}) => {

    //Element reference to the audio tag
    const userAudioRef = useRef<HTMLAudioElement>() as React.RefObject<HTMLAudioElement>;
    
    //Audio context so that audio play without the user interaction
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.value = .5;

    /**
     * Sets the audio source to the audio context
     */
    function setAudioSource() {

        if(userAudioRef.current && audioSrc){

            const audio = userAudioRef.current;

            audio.srcObject = audioSrc;

            audio.onloadedmetadata = () => {
                const source = ctx.createMediaStreamSource(audioSrc);
                audio.play();
                audio.muted = false;
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
            }
        }

    }

    function handlePlay(){
        userAudioRef.current && userAudioRef.current.play();
    }

    useEffect(() => {
        setAudioSource();
    }, [audioSrc])

    return (
        <audio ref={userAudioRef} onCanPlay={handlePlay} autoPlay/>
    );
}
 
export default SimpleAudio;