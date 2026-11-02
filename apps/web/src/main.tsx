import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './styles/base.css';
import './styles/title-menu.css';
import './styles/hall.css';
import './styles/editor-sheet.css';
import './styles/systems.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
