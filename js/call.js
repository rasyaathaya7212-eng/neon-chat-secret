import { db, auth } from './firebase-config.js';
import { 
    doc, 
    setDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc,
    collection,
    addDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { UI } from './ui.js';

export const Call = {
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    unsubscribe: null,
    roomId: null,
    callId: null,
    
    servers: {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
            }
        ]
    },

    async init(roomId) {
        this.roomId = roomId;
        this.callId = 'room-call'; // Simple 1-on-1 per room for this version
        
        // Listen for incoming calls
        const callDoc = doc(db, "rooms", this.roomId, "calls", this.callId);
        this.unsubscribe = onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (data && data.type === 'offer' && !this.peerConnection && data.caller !== auth.currentUser.uid) {
                // Incoming Call
                if (confirm(`Incoming ${data.callType} Call from ${data.callerName}. Accept?`)) {
                    this.answerCall(data.callType);
                }
            }
        });
    },

    async startCall(type) {
        if (!this.roomId) return;
        
        console.log(`Starting ${type} call...`);
        this.setupUI(true);

        // 1. Get User Media
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                video: type === 'video', 
                audio: true 
            });
            this.showLocalVideo();
        } catch (err) {
            console.error("Error getting media:", err);
            alert("Could not access camera/microphone.");
            this.endCall();
            return;
        }

        // 2. Create Peer Connection
        this.peerConnection = new RTCPeerConnection(this.servers);
        
        // 3. Add Tracks
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // 4. Handle ICE Candidates
        this.peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                const candidatesCol = collection(db, "rooms", this.roomId, "calls", this.callId, "offerCandidates");
                await addDoc(candidatesCol, event.candidate.toJSON());
            }
        };

        // 5. Create Offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        // 6. Save Offer to Firestore
        const callDoc = doc(db, "rooms", this.roomId, "calls", this.callId);
        await setDoc(callDoc, {
            type: 'offer',
            callType: type,
            caller: auth.currentUser.uid,
            callerName: auth.currentUser.email.split('@')[0],
            sdp: offer.sdp,
            offerType: offer.type
        });

        // 7. Listen for Answer
        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!this.peerConnection || !data) return;
            
            if (data.type === 'answer' && !this.peerConnection.currentRemoteDescription) {
                const answerDescription = new RTCSessionDescription({ type: data.answerType, sdp: data.sdp });
                this.peerConnection.setRemoteDescription(answerDescription);
            }
        });

        // 8. Listen for Remote ICE Candidates
        const answerCandidates = collection(db, "rooms", this.roomId, "calls", this.callId, "answerCandidates");
        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    this.peerConnection.addIceCandidate(candidate);
                }
            });
        });

        // 9. Handle Remote Stream
        this.peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                this.remoteStream = event.streams[0];
                this.showRemoteVideo();
            });
        };
    },

    async answerCall(type) {
        console.log("Answering call...");
        this.setupUI(false);

        const callDoc = doc(db, "rooms", this.roomId, "calls", this.callId);
        const callData = (await getDoc(callDoc)).data();

        this.peerConnection = new RTCPeerConnection(this.servers);

        // 1. Get User Media
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                video: type === 'video', 
                audio: true 
            });
            this.showLocalVideo();
        } catch (err) {
             console.error("Error getting media:", err);
             return;
        }

        // 2. Add Tracks
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // 3. Handle ICE Candidates
        this.peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                const candidatesCol = collection(db, "rooms", this.roomId, "calls", this.callId, "answerCandidates");
                await addDoc(candidatesCol, event.candidate.toJSON());
            }
        };

        // 4. Set Remote Description (Offer)
        const offerDescription = new RTCSessionDescription({ type: callData.offerType, sdp: callData.sdp });
        await this.peerConnection.setRemoteDescription(offerDescription);

        // 5. Create Answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // 6. Save Answer
        await updateDoc(callDoc, {
            type: 'answer',
            answerType: answer.type,
            sdp: answer.sdp,
            callee: auth.currentUser.uid
        });

        // 7. Listen for Remote ICE Candidates
        const offerCandidates = collection(db, "rooms", this.roomId, "calls", this.callId, "offerCandidates");
        onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    this.peerConnection.addIceCandidate(candidate);
                }
            });
        });

        // 8. Handle Remote Stream
        this.peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                this.remoteStream = event.streams[0];
                this.showRemoteVideo();
            });
        };
    },

    async endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;

        // Clean up UI
        document.getElementById('call-overlay').classList.add('hidden');
        document.getElementById('call-overlay').style.display = 'none';

        // Clean up Firestore (Optional: keep history or delete)
        // For now, reset the call doc
        if (this.roomId) {
            try {
                const callDoc = doc(db, "rooms", this.roomId, "calls", this.callId);
                await deleteDoc(callDoc); 
            } catch (e) {
                console.log("Call ended.");
            }
        }
    },

    setupUI(isCaller) {
        const overlay = document.getElementById('call-overlay');
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        
        document.getElementById('hangup-btn').onclick = () => this.endCall();
    },

    showLocalVideo() {
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = this.localStream;
        }
    },

    showRemoteVideo() {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.srcObject = this.remoteStream;
        }
    }
};
