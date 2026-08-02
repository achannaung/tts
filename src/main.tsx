// Safeguard against third-party scripts attempting to write to window.fetch when it only has a getter
try {
  if (typeof window !== 'undefined' && window.fetch) {
    let currentFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get() {
        return currentFetch;
      },
      set(fn) {
        currentFetch = fn;
      },
    });
  }
} catch (e) {
  // Ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

