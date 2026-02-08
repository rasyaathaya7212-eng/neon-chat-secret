# NeonNexus - Cyberpunk Real-Time Chat

A production-ready, futuristic real-time chat application built with Vanilla JS and Firebase. Designed for dark mode enthusiasts and cyberpunk fans.

## Features

- **Cyberpunk UI/UX**: High-fidelity neon design with CRT scanline effects, glassmorphism, and smooth transitions.
- **Serverless Architecture**: Powered by Firebase (Firestore & Auth) - no Node.js backend server required.
- **Real-Time Messaging**: Instant text synchronization across devices.
- **Media Support**: Send images and voice messages (uses MediaRecorder API).
- **Room System**: Create private rooms with 5-character codes or join existing ones.
- **Cross-Device Sync**: Seamlessly switch between mobile and desktop.

## Prerequisites

- A Google Account (for Firebase).
- A code editor (VS Code recommended).

## Setup Instructions

### 1. Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and name it `NeonNexus`.
3.  Disable Google Analytics (optional, simplifies setup) and click **"Create project"**.

### 2. Enable Authentication

1.  In the left sidebar, click **Build > Authentication**.
2.  Click **"Get started"**.
3.  Select **"Email/Password"** from the Sign-in providers list.
4.  Enable the **"Email/Password"** switch (leave "Email link" disabled).
5.  Click **"Save"**.

### 3. Enable Cloud Firestore

1.  In the left sidebar, click **Build > Firestore Database**.
2.  Click **"Create database"**.
3.  Select a location (e.g., `nam5 (us-central)`).
4.  **Important**: Choose **"Start in test mode"** for initial setup (allows read/write access for 30 days).
    *   *Note: For long-term production, you should configure Security Rules to allow authenticated users to read/write to `rooms/{roomId}/messages`.*
5.  Click **"Create"**.

### 4. Connect Your App

1.  In the Project Overview (gear icon > Project settings), scroll down to **"Your apps"**.
2.  Click the **Web** icon (`</>`).
3.  Register app with nickname `NeonNexus`.
4.  **Copy the `firebaseConfig` object** provided in the script tag.

### 5. Configure the Code

1.  Open `js/firebase-config.js` in your editor.
2.  Replace the placeholder values in the `firebaseConfig` object with your actual keys from step 4.

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "neonnexus-xyz.firebaseapp.com",
    projectId: "neonnexus-xyz",
    storageBucket: "neonnexus-xyz.appspot.com",
    messagingSenderId: "123456...",
    appId: "1:123456..."
};
```

## Running Locally

1.  Open the project folder in VS Code.
2.  Install the **"Live Server"** extension if you haven't already.
3.  Right-click `index.html` and select **"Open with Live Server"**.
4.  The app will launch in your browser at `http://127.0.0.1:5500`.

## Deploying to GitHub Pages

Since this is a static Single Page Application (SPA), it deploys easily to GitHub Pages.

1.  Push your code to a GitHub repository.
2.  Go to the repository **Settings**.
3.  Click **Pages** in the left sidebar.
4.  Under **Build and deployment > Source**, select **Deploy from a branch**.
5.  Select your `main` (or `master`) branch and `/ (root)` folder.
6.  Click **Save**.
7.  Wait a minute, and GitHub will provide your live URL (e.g., `https://yourusername.github.io/repo-name/`).

**Note on Voice Messages**: Voice recording requires a secure context (HTTPS) or Localhost. It will work perfectly on GitHub Pages and Localhost.

## License

MIT License. Free to use and modify.
