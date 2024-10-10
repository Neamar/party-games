import { useEffect, useRef, useState } from 'react';
import './App.css'

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

function TableNumberTile({ number, color, onClick }) {
  return (
    <button style={{backgroundColor: color}} onClick={() => onClick(number)}>
      {number}
    </button>
  );
}

function TablePlayer({ color, player }:{color:string, player:string}) {
  return (
    <div style={{backgroundColor: color, textAlign: "center"}}>
      {player}
    </div>
  );
}

function Table({tableIndex, tableCount, players, currentPlayer, sendMessage}) {
  const playerColors = ['coral', 'lightgreen'];
  const currentPlayerTableIndex = players.findIndex(p => p.id === currentPlayer.id);
  const onNumberClick = (number) => {
    if(currentPlayerTableIndex === -1) {
      return;
    }
    sendMessage("pick", {privateId: currentPlayer.privateId, number})
  }

  return (
    <div className={`table ${currentPlayerTableIndex > -1 ? 'playable' : ''}`}>
      <h1>Table {tableIndex}/{tableCount}</h1>
      <TablePlayer color={playerColors[0]} player={players[0].name} />
      <div id="numbers">
        {Array(10).fill(0).map((d, i) => <TableNumberTile number={i} key={"number-" + i} color={players[0].pick === i ? playerColors[0] : (players[1]?.pick === i ? playerColors[1] : 'transparent')} onClick={onNumberClick} />)}
      </div>
      {players.length === 2 && <TablePlayer color={playerColors[1]} player={players[1].name} />}
      {players.length === 1 && <TablePlayer color='transparent' player='???' />}
    </div>
  );
}

export default function App() {
  const connection = useRef(null);
  const [currentPlayer, setCurrentPlayer] = useState({name:'', id: '', privateId: ''});
  // const [displayedTableIndex, setDisplayedTableIndex] = useState(1);

  const [state, setState] = useState({
    players: {
      'isa': {name:'Isa'},
      'matthieu': {name:'Matthieu'},
      'ugo': {name:'Ugo'},
      'bom': {name:'Bom'},
    },
    tables: [
      {
        index: 1,
        players: [{id:'isa', pick:null}, {id:'matthieu',pick:null}]
      },
      {
        index: 2,
        players: [{id:'bom', pick:3}, {id:'ugo',pick:5}]
      },
    ]
  });

  function sendMessage(type, content) {
    connection.current.send(JSON.stringify({type, content}));
  }

  const handleCurrentPlayerName = (name) => {
    const player = {
      name,
      id: Math.random().toString(),
      privateId: Math.random().toString(),
    };
    sendMessage("player", player);
    setCurrentPlayer(player);
  }

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:9001/" + document.location.hash.slice(1));

    // Listen for messages
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if(message.type === "state") {
        setState(message.content);
      }
    });

    connection.current = socket;

    return () => socket.readyState === socket.OPEN && socket.close();
  }, []);

  return <>
    {!currentPlayer.name && <PlayerNamePicker handleCurrentPlayerName={handleCurrentPlayerName} />}
    <div id="tables">
      {state.tables.map((t) => <Table tableIndex={t.index} tableCount={state.tables.length} key={"table-" + t.index} players={t.players.map(p => ({...p, name:state.players[p.id].name}))} currentPlayer={currentPlayer} sendMessage={sendMessage} />)}
    </div>
  </>
}
