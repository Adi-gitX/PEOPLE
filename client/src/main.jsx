import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'sonner';


useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      closeButton
    />
  </React.StrictMode>
);
