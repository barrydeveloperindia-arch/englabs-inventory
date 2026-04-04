
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './components/NotificationProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// UNREGISTER SERVICE WORKERS (Critical Fix for Capacitor/Android)
// This prevents the PWA Service Worker from intercepting/blocking firebase requests with CORS errors.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      console.log('Unregistering SW:', registration);
      registration.unregister();
    }
  });
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Global Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', background: '#0F172A', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#6366F1', border: 'none', borderRadius: '5px', color: 'white', cursor: 'pointer' }}>
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
