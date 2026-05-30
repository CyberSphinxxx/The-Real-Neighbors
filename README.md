# The Real Neighbors 🏠

A private, neighborhood-exclusive social network built for close friends to share updates, track birthdays, organize events, share links, and watch YouTube videos together.

## Features
- 📰 **Feed**: A central place to post updates, photos, and polls.
- 🎂 **Birthdays**: Automatically tracks everyone's birthdays and exact age (optional privacy toggle available).
- 📅 **Events**: Plan neighborhood hangouts with maps, start/end times, and notes.
- 📺 **Watchlist**: Track anime and TV shows. "Group Picks" automatically surface shows multiple neighbors are watching.
- 🔗 **Links & Watch Party**: Save and tag links with auto-fetched metadata. Paste YouTube URLs to build a synchronized neighborhood queue!

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend & Database**: Firebase Firestore (NoSQL), Firebase Authentication
- **Deployment**: Vercel
- **APIs**: Microlink (URL Metadata), TMDB (Movie/TV Search)

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+
- A Firebase project with Firestore enabled

### 2. Installation
```bash
git clone https://github.com/yourusername/The-Real-Neighbors.git
cd The-Real-Neighbors
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and copy the contents from `.env.production.example`. Fill in your specific Firebase and TMDB credentials.

### 4. Run Development Server
```bash
npm run dev
```

## 🔒 Firebase Security Rules
Ensure you have deployed the Firestore security rules to protect the app. 
Run: `npx firebase deploy --only firestore:rules`
(Or copy `firestore.rules` directly into the Firebase Console).

## 👥 Admin Provisioning Flow
Because this is a private neighborhood app, there is no public "Sign Up" page.
1. The **Admin** logs into the Firebase Console -> Authentication.
2. The Admin manually creates a new user with an email and a temporary password.
3. The Admin adds the user's email to the `allowedEmails` Firestore collection.
4. The user logs in and can then customize their profile (Name, Avatar, Theme).

## 🎨 Themes
The app supports multiple themes stored in `localStorage` to prevent FOUC:
- **Default (Light)**
- **Dark**
- **AMOLED (Pitch Black)**

## 🚀 Deployment (Vercel)
This app is fully optimized as a PWA for Vercel. 
1. Connect your GitHub repository to Vercel.
2. Add all the environment variables from `.env`.
3. The `vercel.json` file is already configured to route all traffic to `index.html` for React Router.

## 🗺️ Future Roadmap
- [ ] Deep TMDB Integration (Fetching Posters and Cast info)
- [ ] Firebase Cloud Messaging (Push Notifications)
- [ ] Capacitor wrapper for native iOS/Android deployment
