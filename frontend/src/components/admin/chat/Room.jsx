import { IconButton } from "@mui/material";
import React, { useRef, useEffect, useState } from "react";
import { MdCallEnd } from "react-icons/md";
import { useSelector } from "react-redux";

const Room = ({ socket, room, videoAnswered, setVideoAnswered }) => {
    const userVideo = useRef();
    const partnerVideo = useRef();
    const selectedVideo = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    const userStream = useRef();
    const senders = useRef([]);
    const [callEnded, setCallEnded] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const userId = useSelector(state => state?.auth?.user?.id);

    useEffect(() => {
        const initMediaDevices = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                userVideo.current.srcObject = stream;
                userStream.current = stream;

                socketRef.current = socket;
                socketRef.current.emit("join room", room);

                socketRef.current.on('other user', userID => {
                    console.log("Connected to another user:", userID);
                    callUser(userID);
                    otherUser.current = userID;
                });

                socketRef.current.on("user joined", userID => {
                    console.log("Another user joined:", userID);
                    otherUser.current = userID;
                });

                socketRef.current.on("offer", handleRecieveCall);

                socketRef.current.on("answer", handleAnswer);

                socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
            } catch (error) {
                console.error('Error initializing media devices:', error);
            }
        };

        initMediaDevices();

        return () => {
            if (userStream.current) {
                userStream.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.close();
            }
        };
    }, []);

    function callUser(userID) {
        peerRef.current = createPeer(userID);
        userStream.current.getTracks().forEach(track => senders.current.push(peerRef.current.addTrack(track, userStream.current)));
    }

    function createPeer(userID) {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });

        peer.onicecandidate = handleICECandidateEvent;
        peer.ontrack = handleTrackEvent;
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

        return peer;
    }

    function handleNegotiationNeededEvent(userID) {
        peerRef.current.createOffer().then(offer => {
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            };
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleRecieveCall(incoming) {
        peerRef.current = createPeer();
        const desc = new RTCSessionDescription(incoming.sdp);
        peerRef.current.setRemoteDescription(desc).then(() => {
            userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
        }).then(() => {
            return peerRef.current.createAnswer();
        }).then(answer => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            socketRef.current.emit("answer", payload);
        }).catch(e => console.log(e));
    }

    function handleAnswer(message) {
        const desc = new RTCSessionDescription(message.sdp);
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        if (peerRef.current.remoteDescription) {
            peerRef.current.addIceCandidate(candidate)
                .catch(e => console.log(e));
        } else {
            console.warn('Received ICE candidate before setting remote description. Saving it for later.');
            // You can store the ICE candidates and add them later when the remote description is set.
            // Example: iceCandidates.push(candidate);
        }
    }

    function handleTrackEvent(e) {
        if (isVideoEnabled) {
            partnerVideo.current.srcObject = e.streams[0];
        } else {
            selectedVideo.current.srcObject = e.streams[0];
        }
    }

    function toggleVideo() {
        setIsVideoEnabled(prev => !prev);
    }

    function endCall() {
        if (peerRef.current) {
            peerRef.current.close();
        }
        // setCallEnded(true);
        setVideoAnswered({
            status: false,
            room: ""
        })
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            {!callEnded ? (
                <>
                    <div style={{ margin: '10px' }}>
                        {isVideoEnabled ? (
                            <video style={{ height: 'auto', width: '400px' }} autoPlay ref={userVideo} />
                        ) : (
                            <audio style={{ height: 'auto', width: '400px' }} autoPlay ref={userVideo} />
                        )}
                        <button onClick={toggleVideo}>{isVideoEnabled ? 'Switch to Audio' : 'Switch to Video'}</button>
                    </div>
                    <div style={{ margin: '10px' }}>
                        {isVideoEnabled ? (
                            <video style={{ height: 'auto', width: '400px' }} autoPlay ref={partnerVideo} />
                        ) : (
                            <video style={{ height: 'auto', width: '400px' }} autoPlay ref={selectedVideo} />
                        )}
                    </div>
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
                        <IconButton
                            onClick={endCall}
                            >
                            <div className='bg-red-800 p-4 rounded-full text-white'>
                            <MdCallEnd size={22}/>
                            </div>
                        </IconButton>
                    </div>
                </>
            ) : (
                <h2>Call Ended</h2>
            )}
        </div>
    );
};

export default Room;
