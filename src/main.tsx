import './digit-global'; // must run before any library component mounts
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n';
import '@egovernments/digit-ui-components-css/dist/index.css';
import './styles/app.css';
import './styles/branding.css';
import './styles/product-home.css';
import './styles/integrations.css';
import './styles/home.css';
import './styles/flow.css';
import './styles/v4.css';
import { applyTheme, savedMix, savedTheme } from './lib/theme';
applyTheme(savedTheme(), savedMix());
import App from './App';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
