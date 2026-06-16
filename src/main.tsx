import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConfirmProvider>
  </StrictMode>,
)
