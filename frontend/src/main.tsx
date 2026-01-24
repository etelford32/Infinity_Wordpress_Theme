import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Get WordPress data passed from PHP
declare global {
  interface Window {
    infinityData?: {
      restUrl: string;
      nonce: string;
      graphqlUrl: string;
      siteUrl: string;
      themePath: string;
      currentUserId: number;
      isUserLoggedIn: boolean;
      theme: string;
      stripeKey: string;
    };
  }
}

// Mount React app
const root = document.getElementById('infinity-root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find #infinity-root element to mount React app');
}
