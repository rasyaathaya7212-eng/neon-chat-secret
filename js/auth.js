import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { UI } from './ui.js';
import { Chat } from './chat.js';

export const Auth = {
    user: null,

    init() {
        console.log("Auth Module Initializing...");

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            console.log("Auth State Changed:", user ? "LOGGED IN" : "LOGGED OUT");
            
            if (user) {
                this.user = user;
                UI.updateUserDisplay(user);
                
                // FORCE UI SWITCH
                console.log("User detected. Switching to Room Screen...");
                UI.showScreen('room');
            } else {
                this.user = null;
                console.log("No user. Switching to Login Screen...");
                UI.showScreen('login');
            }
        });

        // Event Listeners
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const btn = loginForm.querySelector('button');
                const originalText = btn.textContent;
                
                btn.textContent = "Authenticating...";
                btn.disabled = true;

                this.login(email, password).finally(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const btn = signupForm.querySelector('button');
                const originalText = btn.textContent;
                
                btn.textContent = "Creating ID...";
                btn.disabled = true;

                this.signup(email, password).finally(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    async login(email, password) {
        try {
            console.log("Attempting login for:", email);
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful!");
            // UI switch will be handled by onAuthStateChanged
        } catch (error) {
            console.error("Login Error:", error);
            UI.showAuthError(this.formatErrorMessage(error));
        }
    },

    async signup(email, password) {
        try {
            console.log("Attempting signup for:", email);
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Signup successful!");
            // UI switch will be handled by onAuthStateChanged
        } catch (error) {
            console.error("Signup Error:", error);
            UI.showAuthError(this.formatErrorMessage(error));
        }
    },

    async logout() {
        try {
            // Also leave room if connected
            if (Chat && Chat.currentRoomId) {
                Chat.leaveRoom();
            }
            await signOut(auth);
            console.log("Logged out.");
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    formatErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/user-disabled':
                return 'User account disabled.';
            case 'auth/user-not-found':
                return 'User not found.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'Email already in use.';
            case 'auth/weak-password':
                return 'Password is too weak.';
            default:
                return error.message;
        }
    }
};

// Initialize Auth
Auth.init();
