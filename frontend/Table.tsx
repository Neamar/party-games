import { useContext } from 'react';
import { WebsocketContext } from './main';
import './Table.css';
import { Player, State } from './types';

function TableOptionTile({ pickOption, color, onClick, isCorrectPick }) {
  return (
    <button className={`pickOption ${isCorrectPick ? 'correctPick' :''}`} style={{backgroundColor: color, boxShadow: isCorrectPick ? '0px 0px 17px 5px rgba(45,255,196,0.9)': ''}} onClick={() => onClick(pickOption)}>
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

export default function Table({state, currentPlayer, tableIndex}:{state:State, currentPlayer:Player, tableIndex:number}) {
  const sendMessage = useContext(WebsocketContext);
  const playerColors = ['coral', 'lightgreen'];
  // Retrieve player names
  const players = state.tables[tableIndex].players.map(p => ({...p, name:state.players[p.id].name}));
  const isCurrentPlayerInTable = players.some(p => p.id === currentPlayer.id);
  const canPlay = state.status === 'picking';

  const onOptionClick = (pickOption) => {
    if(!canPlay || !isCurrentPlayerInTable) {
      return;
    }
    sendMessage("pick", {privateId: currentPlayer.privateId, pickOption});
  };

  return (
    <div className={`table ${state.status==='picking' ? 'active' : 'inactive'} ${isCurrentPlayerInTable ? 'currentPlayer' : ''}`}>
      <h1>Table {tableIndex + 1}/{state.tables.length}</h1>
      <TablePlayer color={playerColors[0]} player={players[0].name} />
      <div className="pickOptions">
        {state.pickOptions.map((pickOption) => <TableOptionTile pickOption={pickOption} key={pickOption} color={players[0].pick === pickOption ? playerColors[0] : (players[1]?.pick === pickOption ? playerColors[1] : 'transparent')} onClick={onOptionClick} isCorrectPick={pickOption === state.correctPick}/>)}
      </div>
      {players.length === 2 && <TablePlayer color={playerColors[1]} player={players[1].name} />}
      {players.length === 1 && <TablePlayer color='transparent' player='???' />}
    </div>
  );
}
