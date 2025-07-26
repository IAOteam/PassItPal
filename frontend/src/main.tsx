
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
    <React.StrictMode> 
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </HelmetProvider>
    </React.StrictMode>
);