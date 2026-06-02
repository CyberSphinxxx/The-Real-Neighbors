# The Real Neighbors

The Real Neighbors is a private, neighborhood-exclusive social network. It is built for close friends to share updates, message each other in real time, track birthdays, organize events, share links, and watch videos together.

---

## Core Features

### 1. Neighborhood Feed
*   **Central Feed:** A main timeline where members can share text posts, upload photos, and read updates.
*   **Interactive Polls:** Users can create custom polls within posts to vote on topics, with real-time percentage updates as votes are cast.
*   **Comments and Likes:** Members can like posts and write comments to keep discussions going.

### 2. Real-Time Chat System
*   **Group Channels:** Public channels grouped into categories like General, Interests, and Utility. Each channel has a custom emoji icon and a description of its purpose.
*   **Direct Messages:** Private one-on-one messaging rooms. The chat list shows all registered neighborhood members, making it easy to start a private conversation immediately.
*   **Message Interactions:** Users can reply to messages with a quote, edit sent messages, or delete their own messages.
*   **Emoji Reactions:** A quick-reaction popup allows users to react to messages with common emojis.
*   **Typing Indicators:** Displays a notification in the chat bar when another user is actively typing.
*   **Seen Receipts:** Shows the avatar of the other user next to the last message they read in a direct message thread.

### 3. Events Planner
*   **Hangouts and Meetings:** Create events with start times, end times, and descriptive details.
*   **Location Mapping:** Add locations to events to help members find directions.
*   **RSVP System:** Users can mark themselves as attending, tentative, or declined to help track RSVPs.
*   **Notifications:** Highlights upcoming neighborhood events so nobody misses a meetup.

### 4. Shared Watchlist
*   **Show Tracker:** Keep track of TV shows and anime that you are currently watching, planning to watch, or have completed.
*   **TMDB Integration:** Powered by the Movie Database API to search for shows and retrieve correct titles and posters.
*   **Group Picks:** Automatically displays TV shows or movies that multiple neighbors are actively watching.

### 5. Shared Music Playlist
*   **Spotify Playlist:** A dedicated space in the application showing the neighborhood's shared Spotify playlist.
*   **Vibing Status:** Shows what playlist or track neighbors are currently listening to, directly next to their name in the online widget.

### 6. Shared Links and Watch Party
*   **Link Archive:** Save and tag useful websites, articles, or resources. Includes automatic fetching of page titles, descriptions, and preview images.
*   **YouTube Watch Party:** Build a shared video queue by pasting YouTube links. Multiple users can watch the same video list together.

### 7. User Presence and Profiles
*   **Online Widget:** Displays which neighborhood members are currently online and active on the platform.
*   **Last Seen Tracking:** Tracks and shows the last time offline members logged in, respecting individual privacy settings.
*   **Custom Profiles:** Users can customize their display name, bio, custom title, profile picture, accent color, and cover photo.

### 8. Customization and Settings
*   **Visual Themes:** Built-in theme switcher supporting Light mode, Dark mode, and AMOLED (pitch black) mode.
*   **Privacy Settings:** Toggle switches to hide or show your birth year, age, and last seen status.
*   **Account Settings:** Edit credentials and personal details in a dedicated settings dashboard.

---

## Tech Stack

*   **Frontend Library:** React 18
*   **Programming Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling Engine:** Tailwind CSS
*   **Icons Library:** Lucide React
*   **Backend Services:** Firebase Firestore (NoSQL database), Firebase Authentication, and Firebase Realtime Database
*   **Hosting Platform:** Vercel
*   **External APIs:** Microlink API (for extracting link previews), TMDB API (for TV show search)

---

## Database Architecture

### Firestore Collections

*   **users:** Holds user profile documents (display name, avatar URL, bio, privacy settings, and theme choices).
*   **allowedEmails:** Contains a list of approved email addresses. Only users whose emails exist in this collection can create an account and log in.
*   **posts:** Stores main timeline posts, comments, likes, and poll options.
*   **events:** Holds neighborhood event details and RSVP lists.
*   **channels:** Stores public chat channel settings (name, emoji, category, description, and creation time).
*   **dms:** Stores direct message metadata, including participant IDs, last message sent, and read timestamps.
*   **messages:** Subcollections nested under both channels and dms that hold actual chat message content, edit flags, and user reaction maps.

### Realtime Database Paths

*   **typing/{threadId}/{userId}:** Stores temporary typing state records for active chat rooms. The records are cleared automatically when a user stops typing or disconnects.
*   **presence/{userId}:** Tracks whether a user is currently online or offline and logs their last active timestamp.

---

## Getting Started Locally

### 1. Prerequisites
*   Node.js 18 or higher installed on your computer.
*   A Firebase project created in the Firebase console.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/yourusername/The-Real-Neighbors.git
cd The-Real-Neighbors
npm install
```

### 3. Environment Variables
Create a file named `.env` in the root folder of the project. Copy the template from `.env.production.example` and fill in your credentials:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_DATABASE_URL=your_firebase_rtdb_url
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_TMDB_API_READ_ACCESS_TOKEN=your_tmdb_token
```

### 4. Running the App
Start the local development server:
```bash
npm run dev
```
Open the link displayed in your terminal (usually http://localhost:5173) in your web browser.

---

## Security Rules Deployment

To protect the application database, you must deploy the database rules file to Firebase.

You can deploy the rules by running:
```bash
npx firebase deploy --only firestore:rules
```
Alternatively, you can open the `firestore.rules` file in a text editor, copy its contents, and paste them directly into the Rules tab of the Firestore Database section in your Firebase Console.

---

## Adding New Members

Because The Real Neighbors is a private social network, there is no public sign-up form. To invite a neighbor:

1.  Log in to your Firebase Console and navigate to the **Authentication** section.
2.  Click **Add User** and create an account with their email address and a temporary password.
3.  Go to the **Firestore Database** section in the Firebase Console.
4.  Add a document to the `allowedEmails` collection where the document ID is the new user's email address.
5.  Share the login details with your neighbor. When they log in for the first time, they can update their display name, avatar, and password.

---

## Deployment

The application is configured for deployment on Vercel:

1.  Connect your GitHub repository to Vercel.
2.  Add the environment variables listed in your local `.env` file under the project settings on Vercel.
3.  Deploy the project. The configuration in the `vercel.json` file will automatically handle routing so that React Router routes function correctly when accessed directly.
