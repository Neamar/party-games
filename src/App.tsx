import { useState } from 'react';

function TableNumberTile({ number, color, onClick }) {
  return (
    <button style={{backgroundColor: color}} onClick={(e) => onClick(number)}>
      {number}
    </button>
  );
}

function TablePlayer({ color, player }) {
  return (
    <div style={{backgroundColor: color, textAlign: "center"}}>
      {player}
    </div>
  );
}

function Table({tableIndex, tableCount, players, currentPlayer, onCurrentPlayerPick}) {
  const playerColors = ['coral', 'lightgreen'];
  const currentPlayerTableIndex = players.findIndex(p => p.name === currentPlayer);

  const onNumberClick = currentPlayerTableIndex === -1 ? () => {} : onCurrentPlayerPick

  return (
    <div className={`table ${currentPlayerTableIndex > -1 ? 'playable' : ''}`}>
      <h1>Table {tableIndex}/{tableCount}</h1>
      <TablePlayer color={playerColors[0]} player={players[0].name} />
      <div id="numbers">
        {Array(10).fill(0).map((d, i) => <TableNumberTile number={i} key={"number-" + i} color={players[0].pick === i ? playerColors[0] : (players[1].pick === i ? playerColors[1] : 'transparent')} onClick={onNumberClick} />)}
      </div>
      <TablePlayer color={playerColors[1]} player={players[1].name} />
    </div>
  );
}

export default function App() {
  const [currentPlayer, setCurrentPlayer] = useState("Matthieu");
  const [displayedTable, setDisplayedTable] = useState(1);
  const [tables, setTables] = useState([
    {
      index: 1,
      players: [{
        name:"Isa",
        pick: null
      }, {
        name:"Matthieu",
        pick: null
      }]
    },
    {
      index: 2,
      players: [{name:"Bom", pick:3}, {name:"Ugo", pick: null}],
    },
    {
      index: 3,
      players: [{name:"Jules", pick:1}, {name:"Michael", pick:3}],
    },
    {
      index: 4,
      players: [{name:"Camille", pick:3}, {name:"Poul3t", pick:5}],
    }
  ]);

  const onCurrentPlayerPick = (pickedNumber) => {
    const newTables = structuredClone(tables);
    newTables.some((table) => {
      return table.players.some(player => {
        if(player.name === currentPlayer) {
          player.pick = pickedNumber;
          return true;
        }
        return false;
      })
    });
    setTables(newTables);
  }

  return <>
    <div id="tables">
      {tables.map((t) => <Table tableIndex={t.index} tableCount={tables.length} key={"table-" + t.index} players={t.players} currentPlayer={currentPlayer} onCurrentPlayerPick={onCurrentPlayerPick} />)}
    </div>
  </>
}
