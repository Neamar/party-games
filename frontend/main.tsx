import { createContext, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type SendMessage = (type: string, content: object) => void;

export const WebsocketContext = createContext<SendMessage>(() => {});


if(!document.location.hash) {
  document.location.hash = Date.now().toString();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
