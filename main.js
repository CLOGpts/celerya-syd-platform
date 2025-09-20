// Emergency loader for React app
console.log('Loading app from CDN...');

// Import React from CDN
import React from 'https://esm.sh/react@18.3.1';
import ReactDOM from 'https://esm.sh/react-dom@18.3.1/client';

// Simple App component
const App = () => {
  return React.createElement('div', {
    className: 'min-h-screen bg-gray-900 text-white p-8'
  }, [
    React.createElement('h1', {
      key: 'title',
      className: 'text-4xl font-bold mb-4'
    }, '🚀 SYD Dashboard - Emergency Mode'),
    React.createElement('div', {
      key: 'status',
      className: 'bg-green-900/20 border border-green-500 rounded p-4'
    }, [
      React.createElement('p', {key: 'p1'}, '✅ Server attivo su porta 5174'),
      React.createElement('p', {key: 'p2'}, '⚠️ Caricamento da CDN (dipendenze locali mancanti)'),
      React.createElement('p', {key: 'p3'}, '🔧 Firebase config in corso...'),
    ]),
    React.createElement('button', {
      key: 'btn',
      className: 'mt-4 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700',
      onClick: () => window.location.reload()
    }, 'Ricarica')
  ]);
};

// Mount app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));