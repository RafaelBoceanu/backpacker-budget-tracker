// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { inject } from '@vercel/analytics';
import './index.css';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';

inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<App />} />
          <Route path="/app/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);