import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import FeedPage from './pages/FeedPage';
import React, { Suspense } from 'react';
import { PageSkeleton } from './components/ui/PageSkeleton';

import { GlobalStyleManager } from './components/layout/GlobalStyleManager';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const BirthdaysPage = React.lazy(() => import('./pages/BirthdaysPage'));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const WatchlistPage = React.lazy(() => import('./pages/WatchlistPage'));
const LinksPage = React.lazy(() => import('./pages/LinksPage'));
const PlaylistPage = React.lazy(() => import('./pages/PlaylistPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const AIPage = React.lazy(() => import('./pages/AIPage'));
const GamesPage = React.lazy(() => import('./pages/GamesPage'));
const WordlePage = React.lazy(() => import('./pages/games/WordlePage'));
const TriviaPage = React.lazy(() => import('./pages/games/TriviaPage'));
const ReactionPage = React.lazy(() => import('./pages/games/ReactionPage'));
const TypeRacerPage = React.lazy(() => import('./pages/games/TypeRacerPage'));

function App() {
  return (
    <Router>
      <GlobalStyleManager />
      <Suspense fallback={<PageSkeleton />}><Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route index element={<FeedPage />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="birthdays" element={<BirthdaysPage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="playlist" element={<PlaylistPage />} />
          <Route path="profile/:handle" element={<ProfilePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:channelId" element={<ChatPage />} />
          <Route path="chat/dm/:dmId" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="ai" element={<AIPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/wordle" element={<WordlePage />} />
          <Route path="games/trivia" element={<TriviaPage />} />
          <Route path="games/reaction" element={<ReactionPage />} />
          <Route path="games/typeracer" element={<TypeRacerPage />} />
        </Route>
      </Routes></Suspense>
      <Toaster position="bottom-center" />
    </Router>
  );
}

export default App;

