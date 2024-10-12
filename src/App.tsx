import { createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css'

type Player = {
  name: string,
  id: string,
  privateId?: string
};

type TablePlayer = {
  id: string,
  pick: string
};

type Table = {
  index: number,
  players: TablePlayer[]
};
type State = {
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


function PlayerNamePicker({handleCurrentPlayerName}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    handleCurrentPlayerName(event.currentTarget.elements['player-name'].value)
  }

  return <dialog ref={dialogRef}>
    <h1>Welcome to UpDown!</h1>
    <p>Pick a name to get started.</p>
    <form onSubmit={handleSubmit}>
      <input type="text" id="player-name"/>
      <input type="submit" value="Submit" />
    </form>
  </dialog>
}

function TableOptionTile({ pickOption, color, onClick, isCorrectPick }) {
  return (
    <button style={{backgroundColor: color, boxShadow: isCorrectPick ? '0px 0px 17px 5px rgba(45,255,196,0.9)': ''}} onClick={() => onClick(pickOption)}>
      {pickOption}
    </button>
  );
}

function TablePlayer({ color, player }:{color:string, player:string}) {
  return (
    <div className="tablePlayer" style={{backgroundColor: color}}>
      {player}
    </div>
  );
}

function Table({tableIndex, tableCount, players, currentPlayer, pickOptions, correctPick}) {
  const sendMessage = useContext(WebsocketContext);
  const playerColors = ['coral', 'lightgreen'];
  const currentPlayerTableIndex = players.findIndex(p => p.id === currentPlayer.id);
  const onOptionClick = (pickOption) => {
    if(currentPlayerTableIndex === -1) {
      return;
    }
    sendMessage("pick", {privateId: currentPlayer.privateId, pickOption})
  }

  return (
    <div className={`table ${currentPlayerTableIndex > -1 ? 'playable' : ''}`}>
      <h1>Table {tableIndex}/{tableCount}</h1>
      <TablePlayer color={playerColors[0]} player={players[0].name} />
      <div id="pickOptions">
        {pickOptions.map((pickOption) => <TableOptionTile pickOption={pickOption} key={pickOption} color={players[0].pick === pickOption ? playerColors[0] : (players[1]?.pick === pickOption ? playerColors[1] : 'transparent')} onClick={onOptionClick} isCorrectPick={pickOption === correctPick}/>)}
      </div>
      {players.length === 2 && <TablePlayer color={playerColors[1]} player={players[1].name} />}
      {players.length === 1 && <TablePlayer color='transparent' player='???' />}
    </div>
  );
}

function GameMasterControls({state}:{state:State}) {
  const sendMessage = useContext(WebsocketContext);

  if(state.status === 'picking') {
    return <div id="buttons">
      <select defaultValue={state.correctPick} onChange={(e) => sendMessage('correctPick', {correctPick: e.target.value})}>
        <option value="">Pick one...</option>
        {state.pickOptions.map((pickOption) => <option value={pickOption} key={pickOption}>{pickOption}</option>)}
      </select>
      <button onClick={() => sendMessage('status', {status:'moving'})}>Validate answers</button>
    </div>
  }
  else {
    return <div id="buttons">
      <button onClick={() => sendMessage('status', {status:'picking'})}>Allow user to pick</button>
    </div>
  }
}

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
