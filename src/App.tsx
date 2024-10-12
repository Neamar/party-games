import { createContext, useEffect, useRef, useState } from 'react';
import './App.css'
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
  status: string,
};
type SendMessage = (type: string, content: object) => void;

export const WebsocketContext = createContext<SendMessage>(() => {})


const gameId = document.location.hash.slice(1);
const localStoragePlayerKey = `game/${gameId}`;

export default function App() {
  const connection = useRef<WebSocket>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(localStorage.getItem(localStoragePlayerKey) ? JSON.parse(localStorage.getItem(localStoragePlayerKey)) : {name:'', id: '', privateId: ''});
  // const [displayedTableIndex, setDisplayedTableIndex] = useState(1);


  const [state, setState] = useState<State>({
    players: {},
    tables: [],
    pickOptions: [],
    correctPick: null,
    status: 'unplayed'
  });

  function sendMessage(type:string, content:object) {
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
  }

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
      const socket = new WebSocket("ws://localhost:9001/" + gameId);

      // Listen for messages
      socket.addEventListener("message", onMessage);

      socket.addEventListener("close", onClose);
      connection.current = socket;
    }
    createSocket();

    return () => {
      if(connection.current?.readyState === connection.current?.OPEN) {
        // Do not recreate the socket if closing from client
        connection.current.removeEventListener("close", onClose);
        connection.current.removeEventListener("message", onMessage);
        connection.current.close();
      }
    }
  }, []);

  return <WebsocketContext.Provider value={sendMessage}>
    {!currentPlayer.name && <PlayerNamePicker handleCurrentPlayerName={handleCurrentPlayerName} />}
    <GameMasterControls state={state} />
    <div id="tables">
      {state.tables.map((t, index) => <Table tableIndex={index + 1} tableCount={state.tables.length} key={"table-" + index} players={t.players.map(p => ({...p, name:state.players[p.id].name}))} currentPlayer={currentPlayer} pickOptions={state.pickOptions} correctPick={state.correctPick}/>)}
    </div>
  </WebsocketContext.Provider>
}
