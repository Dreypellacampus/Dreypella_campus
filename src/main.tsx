import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import CustomerSessionProvider from '@/components/account/CustomerSessionProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomerSessionProvider>
      <App />
    </CustomerSessionProvider>
  </StrictMode>
);
