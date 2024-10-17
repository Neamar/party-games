import { createContext, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { SendClientMessage } from '../types.ts';
import App from './App.tsx';
import './main.css';

export const WebsocketContext = createContext<SendClientMessage>(() => {});


if(!document.location.hash) {
  document.location.hash = Date.now().toString();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App gameId={document.location.hash.slice(1)} />
  </StrictMode>,
);
