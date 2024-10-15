import { createContext, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SendClientMessage } from '../types.ts';

export const WebsocketContext = createContext<SendClientMessage>(() => {});


if(!document.location.hash) {
  document.location.hash = Date.now().toString();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
