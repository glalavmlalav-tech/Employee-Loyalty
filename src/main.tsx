import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initLogoSync } from './utils/logoManager';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f3ece6] flex flex-col items-center justify-center p-6 text-center dir-rtl" dir="rtl">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-800">داواکاری سەرهەڵدانی هەڵە</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              سیستەمەکە ڕووبەڕووی هەڵەیەک بووەوە لە کاتی بارکردندا. تکایە پەڕەکە نوێ (Refresh) بکەرەوە.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl transition shadow-lg cursor-pointer"
            >
              نوێکردنەوەی پەڕەکە (Refresh)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Register PWA service worker safely so iframe sandbox restrictions never break app startup
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({ immediate: true });
  }
} catch (e) {
  console.warn('PWA registerSW notice:', e);
}

try {
  initLogoSync();
} catch (e) {
  console.warn('Logo sync notice:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

