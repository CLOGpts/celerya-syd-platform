import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './src/styles/global.css';

// ATTIVA ERROR INTERCEPTOR - Cattura TUTTI gli errori
import { errorInterceptor } from './src/services/errorInterceptor';
errorInterceptor.activate();

// ATTIVA LIVE LOG STREAMING - Invia tutto a Claude
import { liveLogStream } from './src/services/liveLogStream';
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