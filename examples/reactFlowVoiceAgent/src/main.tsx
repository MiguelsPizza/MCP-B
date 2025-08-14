import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import reportWebVitals from './reportWebVitals';

import './index.css';
import App from './App.tsx';

// import { LiveAPIProvider } from './contexts/LiveAPIContext';
// import { API_CONFIG } from './contexts/llmConfig.tsx';
import { GeminiProvider } from './ai/geminiContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GeminiProvider
    // apiKey={API_KEY}
    >
      {/* <LiveAPIProvider url={API_CONFIG.uri} apiKey={API_KEY}> */}
      <App />
      {/* </LiveAPIProvider> */}
    </GeminiProvider>
  </StrictMode>
);

// reportWebVitals();
