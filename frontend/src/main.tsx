
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx'; // Import AuthProvider
import React from 'react';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode> 
        <AuthProvider> 
            <App />
        </AuthProvider>
    </React.StrictMode>
);