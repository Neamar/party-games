import { useContext } from 'react';
import { WebsocketContext } from './App';

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

export default function Table({tableIndex, tableCount, players, currentPlayer, pickOptions, correctPick}) {
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
