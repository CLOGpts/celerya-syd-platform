import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './src/styles/global.css';

// BADGE KILLER ULTRA-AGGRESSIVO + SERVIZI
import { badgeKiller } from './src/utils/badgeKiller';
import { errorInterceptor } from './src/services/errorInterceptor';
import { liveLogStream } from './src/services/liveLogStream';

// ATTIVA BADGE KILLER PRIMA DI TUTTO
badgeKiller.activate();

// Attiva servizi con zero possibilità badge
errorInterceptor.activate();
liveLogStream.startStreaming();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // Temporaneamente disabilitato per test determinismo Firebase
  // <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  // </React.StrictMode>
);