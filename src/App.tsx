import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import BirthdaysPage from './pages/BirthdaysPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route index element={<FeedPage />} />
          <Route path="watchlist" element={<div className="p-4">Watchlist Placeholder</div>} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="birthdays" element={<BirthdaysPage />} />
          <Route path="links" element={<div className="p-4">Links Placeholder</div>} />
        </Route>
      </Routes>
      <Toaster position="bottom-center" />
    </Router>
  );
}

export default App;
