export const UI = {
    getScreen(name) {
        const ids = {
            login: 'login-screen',
            room: 'room-screen',
            chat: 'chat-screen'
        };
        return document.getElementById(ids[name]);
    },
    
    showScreen(screenName) {
        console.log(`UI: Switching to screen '${screenName}'`);
        
        const allScreens = ['login', 'room', 'chat'];
        
        // 1. Hide everything immediately
        allScreens.forEach(name => {
            const el = this.getScreen(name);
            if (el) {
                el.classList.remove('active');
                el.classList.add('hidden');
                el.style.display = 'none'; // Force hide
            }
        });
        
        // 2. Show the target
        const target = this.getScreen(screenName);
        if (target) {
            target.classList.remove('hidden');
            target.style.display = 'flex'; // Force flex layout
            
            // Force a browser reflow/repaint to ensure transition triggers
            void target.offsetWidth;
            
            target.classList.add('active');
        } else {
            console.error(`UI: Screen '${screenName}' not found!`);
        }
    },
    
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.classList.add('hidden');
                errorEl.style.display = 'none';
            }, 5000);
        }
    },
    
    updateUserDisplay(user) {
        const displayEl = document.getElementById('user-display-name');
        if (displayEl && user) {
            displayEl.textContent = user.email.split('@')[0];
        }
    },
    
    updateRoomInfo(roomCode) {
        const roomCodeEl = document.getElementById('current-room-code');
        if (roomCodeEl) {
            roomCodeEl.textContent = roomCode;
        }
    },
    
    toggleRecordingOverlay(show) {
        const overlay = document.getElementById('recording-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
                overlay.style.display = 'flex';
            } else {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
            }
        }
    }
};
