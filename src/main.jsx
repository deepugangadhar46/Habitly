import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker } from './lib/pwa'
import { ErrorBoundary } from './components/ErrorBoundary'

// Register service worker for PWA functionality
registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
