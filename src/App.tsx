import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import Feed from './pages/Feed';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Feed />} />
          <Route path="watchlist" element={<div className="p-4">Watchlist Placeholder</div>} />
          <Route path="events" element={<div className="p-4">Events Placeholder</div>} />
          <Route path="birthdays" element={<div className="p-4">Birthdays Placeholder</div>} />
          <Route path="links" element={<div className="p-4">Links Placeholder</div>} />
        </Route>
      </Routes>
      <Toaster position="bottom-center" />
    </Router>
  );
}

export default App;
