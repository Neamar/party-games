import { createContext, useEffect, useRef, useState } from 'react';
import './App.css';
import GameMasterControls from './GameMasterControls';
import PlayerNamePicker from './PlayerNamePicker';
import Table from './Table';

export type Player = {
  name: string,
  id: string,
  privateId?: string
};

export type TablePlayer = {
  id: string,
  pick: string
};

export type Table = {
  index: number,
  players: TablePlayer[]
};
export type State = {
  players: {
    [id: string]: Player
  },
  tables: Table[],
  pickOptions: string[],
  correctPick: string,
  status: ('unplayed'|'picking'|'moving'),
};
type SendMessage = (type: string, content: object) => void;

export const WebsocketContext = createContext<SendMessage>(() => {});


const gameId = document.location.hash.slice(1);
const localStoragePlayerKey = `game/${gameId}`;

export default function App() {
  const connection = useRef<WebSocket>(null);
  const tablesRef = useRef(new Map<number, HTMLDivElement>());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(localStorage.getItem(localStoragePlayerKey) ? JSON.parse(localStorage.getItem(localStoragePlayerKey)) : {name:'', id: '', privateId: ''});

  const [state, setState] = useState<State>({
    players: {},
    tables: [],
    pickOptions: [],
    correctPick: null,
    status: 'unplayed'
  });

  function sendMessage(type:string, content:object) {
    // todo: should queue message if connection isn't open
    connection.current.send(JSON.stringify({type, content}));
  }

  const handleCurrentPlayerName = (name:string) => {
    const player:Player = {
      name,
      id: Math.random().toString(),
      privateId: Math.random().toString(),
    };
    sendMessage("player", player);
    setCurrentPlayer(player);
    localStorage.setItem(localStoragePlayerKey, JSON.stringify(player));
  };

  /**
   * Websocket handling:
   * * reconnect on close
   * * update state as needed
   */
  useEffect(() => {
    const onClose = () => {
      // Recreate connection
      createSocket();
    };

    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if(message.type === "state") {
        setState(message.content);
      }
    };

    const createSocket = () => {
      const wsBaseUrl = document.location.hostname === 'localhost' ? "ws://localhost:9001" : "wss://" + document.location.hostname;
      console.log(wsBaseUrl, `${wsBaseUrl}/${gameId}`);
      const socket = new WebSocket(`${wsBaseUrl}/${gameId}`);

      // Listen for messages
      socket.addEventListener("message", onMessage);

      socket.addEventListener("close", onClose);
      connection.current = socket;
    };
    createSocket();

    return () => {
      if(connection.current?.readyState === connection.current?.OPEN) {
        // Do not recreate the socket if closing from client
        connection.current.removeEventListener("close", onClose);
        connection.current.removeEventListener("message", onMessage);
        connection.current.close();
      }
    };
  }, []);

  const currentPlayerTableIndex = state.tables.findIndex((table) => table.players.some(p => currentPlayer.id === p.id));
  /**
   * Scroll to table on table change
   */
  useEffect(() => {
    const t = tablesRef.current.get(currentPlayerTableIndex);
    if(!t) {
      return;
    }

    t.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentPlayerTableIndex]);

  return <WebsocketContext.Provider value={sendMessage}>
    {!currentPlayer.name && <PlayerNamePicker handleCurrentPlayerName={handleCurrentPlayerName} />}
    <GameMasterControls state={state} />
    <div id="tables">
      {state.tables.map((t, index) => (
        <div
          key={"table-" + index}
          ref={(node) => {
            if (node) {
              // Add to the Map
              tablesRef.current.set(index, node);
            } else {
              // Remove from the Map
              tablesRef.current.delete(index);
            }
        }}>
          <Table
            tableIndex={index}
            state={state}
            currentPlayer={currentPlayer}
          />
        </div>)
       )}
    </div>
  </WebsocketContext.Provider>;
}
