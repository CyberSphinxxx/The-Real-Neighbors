import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import FeedPage from './pages/FeedPage';
import React, { Suspense } from 'react';
import { PageSkeleton } from './components/ui/PageSkeleton';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const BirthdaysPage = React.lazy(() => import('./pages/BirthdaysPage'));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const WatchlistPage = React.lazy(() => import('./pages/WatchlistPage'));
const LinksPage = React.lazy(() => import('./pages/LinksPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<PageSkeleton />}><Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route index element={<FeedPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="birthdays" element={<BirthdaysPage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes></Suspense>
      <Toaster position="bottom-center" />
    </Router>
  );
}

export default App;
