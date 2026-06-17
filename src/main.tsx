import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/major-mono-display/400.css';
import 'leaflet/dist/leaflet.css';
import './utils/leafletIconFix';
import './index.css';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { FontScaleProvider } from './contexts/FontScaleContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FontScaleProvider>
        <App />
      </FontScaleProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
