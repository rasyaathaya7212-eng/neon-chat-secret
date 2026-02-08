import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { UI } from './ui.js';
import { Call } from './call.js';

export const Chat = {
    currentRoomId: null,
    unsubscribe: null,
    mediaRecorder: null,
    audioChunks: [],

    init() {
        // Room Controls
        const createBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const leaveBtn = document.getElementById('leave-room-btn');

        if (createBtn) createBtn.addEventListener('click', () => this.createRoom());
        if (joinBtn) joinBtn.addEventListener('click', () => {
            const code = document.getElementById('room-code-input').value.trim();
            if (code.length === 5) {
                this.joinRoom(code);
            } else {
                alert("Room code must be 5 characters.");
            }
        });
        if (leaveBtn) leaveBtn.addEventListener('click', () => this.leaveRoom());

        // Call Controls
        const videoBtn = document.getElementById('video-call-btn');
        const voiceBtn = document.getElementById('voice-call-btn');
        
        if (videoBtn) videoBtn.addEventListener('click', () => {
             if (this.currentRoomId) Call.startCall('video');
        });
        if (voiceBtn) voiceBtn.addEventListener('click', () => {
             if (this.currentRoomId) Call.startCall('audio');
        });

        // Chat Controls
        const msgForm = document.getElementById('message-form');
        if (msgForm) {
            msgForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Image Handling
        const imageBtn = document.getElementById('image-btn');
        const imageInput = document.getElementById('image-input');
        if (imageBtn && imageInput) {
            imageBtn.addEventListener('click', () => imageInput.click());
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Voice Handling
        const micBtn = document.getElementById('mic-btn');
        const cancelRecBtn = document.getElementById('cancel-recording-btn');
        const sendRecBtn = document.getElementById('send-recording-btn');

        if (micBtn) micBtn.addEventListener('click', () => this.startRecording());
        if (cancelRecBtn) cancelRecBtn.addEventListener('click', () => this.cancelRecording());
        if (sendRecBtn) sendRecBtn.addEventListener('click', () => this.stopAndSendRecording());
    },

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    async createRoom() {
        if (!auth.currentUser) {
            alert("You must be logged in.");
            return;
        }
        const roomCode = this.generateRoomCode();
        const roomName = document.getElementById('new-room-name').value.trim() || 'Unnamed Room';
        const roomPass = document.getElementById('new-room-password').value.trim();
        
        try {
            await setDoc(doc(db, "rooms", roomCode), {
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser.uid,
                name: roomName,
                password: roomPass // In production, this should be hashed!
            });
            alert(`Room Created! Code: ${roomCode}`);
            this.joinRoom(roomCode);
        } catch (e) {
            console.error("Error creating room: ", e);
            alert("Could not create room. Check console/permissions.");
        }
    },

    async joinRoom(roomCode) {
        if (!auth.currentUser) return;
        
        // Basic Password Check (Client-side for demo, should be server-side rule in prod)
        const enteredPass = document.getElementById('join-room-password').value.trim();
        // In a real app, you'd fetch the room doc first to check password
        
        this.currentRoomId = roomCode;
        UI.updateRoomInfo(roomCode);
        UI.showScreen('chat');
        this.subscribeToMessages(roomCode);
        
        // Initialize Call Module
        Call.init(roomCode);
    },

    leaveRoom() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.currentRoomId = null;
        document.getElementById('chat-messages').innerHTML = '';
        UI.showScreen('room');
    },

    subscribeToMessages(roomCode) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        console.log(`Subscribing to messages in room: ${roomCode}`);
        const q = query(
            collection(db, "rooms", roomCode, "messages"), 
            orderBy("createdAt", "asc")
        );
        
        this.unsubscribe = onSnapshot(q, (snapshot) => {
             console.log(`Snapshot received! Docs: ${snapshot.size}`);
             const chatBox = document.getElementById('chat-messages');
             
             if (snapshot.empty) {
                 console.log("Snapshot is empty.");
             }

             snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    console.log("New message added:", change.doc.data());
                    const msg = change.doc.data();
                    const msgEl = this.createMessageElement(msg, change.doc.id);
                    chatBox.appendChild(msgEl);
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
             });
        }, (error) => {
            console.error("Snapshot Error:", error);
            if (error.code === 'failed-precondition') {
                alert("Database Error: Requires an Index. Check console for link.");
            } else if (error.code === 'permission-denied') {
                alert("Database Error: Permission Denied. Check Rules.");
            }
        });
    },

    createMessageElement(data, id) {
        const isMine = auth.currentUser && data.uid === auth.currentUser.uid;
        const div = document.createElement('div');
        div.className = `message ${isMine ? 'mine' : 'theirs'}`;
        
        let content = '';
        if (data.type === 'text') {
            content = `<p>${this.escapeHtml(data.content)}</p>`;
        } else if (data.type === 'image') {
            content = `<img src="${data.content}" alt="Image" />`;
        } else if (data.type === 'audio') {
            content = `<audio controls src="${data.content}"></audio>`;
        }

        const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';
        const sender = data.email ? data.email.split('@')[0] : 'Anon';

        div.innerHTML = `
            <span class="sender">${sender}</span>
            ${content}
            <span class="timestamp">${time}</span>
        `;
        return div;
    },

    async sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        
        if (!auth.currentUser) {
            console.error("SendMessage Failed: No User");
            alert("Error: You appear to be logged out. Please re-login.");
            return;
        }
        if (!this.currentRoomId) {
            console.error("SendMessage Failed: No Room ID");
            alert("Error: You are not in a room. Please rejoin.");
            return;
        }
        if (!text) return;

        try {
            console.log(`Sending message to rooms/${this.currentRoomId}/messages`);
            await addDoc(collection(db, "rooms", this.currentRoomId, "messages"), {
                type: 'text',
                content: text,
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                createdAt: serverTimestamp()
            });
            console.log("Message sent successfully");
            input.value = '';
        } catch (e) {
            console.error("Error sending message: ", e);
            if (e.code === 'permission-denied') {
                alert("PERMISSION ERROR: Message not sent.\n\nDid you set Firestore to 'Test Mode'?\nGo to Firebase Console > Firestore > Rules and allow read/write.");
            } else {
                alert(`Error sending message: ${e.message}`);
            }
        }
    },

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file || !this.currentRoomId) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            if (file.size > 700000) {
                alert("Image too large (Max 700KB for Base64 storage).");
                return;
            }

            try {
                await addDoc(collection(db, "rooms", this.currentRoomId, "messages"), {
                    type: 'image',
                    content: base64String,
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    createdAt: serverTimestamp()
                });
            } catch (error) {
                console.error("Error uploading image: ", error);
                alert("Failed to send image.");
            }
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    },

    // Voice Logic
    async startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Audio recording not supported on this browser/context.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener("dataavailable", event => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.start();
            UI.toggleRecordingOverlay(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available.");
        }
    },

    cancelRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.stopStream();
        UI.toggleRecordingOverlay(false);
        this.audioChunks = [];
    },

    stopAndSendRecording() {
        if (!this.mediaRecorder || !this.currentRoomId) return;

        this.mediaRecorder.addEventListener("stop", async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.stopStream();
            UI.toggleRecordingOverlay(false);

            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                 if (base64Audio.length > 1000000) {
                    alert("Audio recording too long for Base64 storage.");
                    return;
                }
                
                try {
                    await addDoc(collection(db, "rooms", this.currentRoomId, "messages"), {
                        type: 'audio',
                        content: base64Audio,
                        uid: auth.currentUser.uid,
                        email: auth.currentUser.email,
                        createdAt: serverTimestamp()
                    });
                } catch (e) {
                    console.error("Error sending audio:", e);
                }
            };
        });

        this.mediaRecorder.stop();
    },

    stopStream() {
        if (this.mediaRecorder && this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

Chat.init();
