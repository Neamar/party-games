import { Fragment, useContext } from 'react';
import { WebsocketContext } from './main';
import { State } from '../types';
import "./GameMasterControls.css";

export default function GameMasterControls({state}:{state:State}) {
  const sendMessage = useContext(WebsocketContext);
  const actions = [
    <button key="shuffle" onClick={() => sendMessage({type:'shuffleTables'})}>Mélanger les tables</button>
  ];

  if(state.status === 'picking') {
    actions.push(<Fragment key="picking">
    <select defaultValue={state.correctPick} onChange={(e) => sendMessage({type:'setCorrectPick', correctPick: e.target.value})}>
        <option value="">Choisissez...</option>
        {state.pickOptions.map((pickOption) => <option value={pickOption} key={pickOption}>{pickOption}</option>)}
      </select>
      <button onClick={() => sendMessage({type:'setGameStatus', status:'moving'})}>Valider les réponses</button>
      <button onClick={() => sendMessage({type:'setGameStatus', status:'unplayed'})}>Retour à l'écran de départ</button>
    </Fragment>);
  }
  else if(state.status==='moving'){
    actions.push(<button key="moving" onClick={() => sendMessage({type:'setGameStatus', status:'picking'})}>Autoriser les choix</button>);
  }  else if(state.status==='unplayed'){
      actions.push(<button key="moving" onClick={() => sendMessage({type:'setGameStatus', status:'picking'})}>Lancer la partie</button>);
    }

  if(Object.keys(state.players).length > 0) {
    actions.push(<div key="remove">
      Bannir <select defaultValue='' onChange={(e) => sendMessage({type: 'removePlayer', id: e.target.value})}>
        <option value="">---</option>
        {Object.values(state.players).map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
      </select>
    </div>);
  }

  let tips = [];
  if(state.status === 'picking') {
    if(state.correctPick) {
      tips = state.tables.filter((t) => t.players[0].pick != state.correctPick && (t.players.length === 1 || t.players[1].pick != state.correctPick)).map(t => {
        if(t.players.length === 1)
          return <li key={t.players[0].id}>{state.players[t.players[0].id].name} n'a pas choisi la bonne réponse</li>;
        else
          return <li key={t.players[0].id}>La table {state.players[t.players[0].id].name} / {state.players[t.players[1].id].name} n'a aucun vainqueur pour l'instant </li>;
    });
    }
    else {
      const tablePlayers = state.tables.map(t => t.players).flat(1);
      tips = tablePlayers.filter(player => !player.pick).map(player => <li key={player.id}>{state.players[player.id].name} n'a choisi aucune proposition</li>);
    }
  }
  else if(state.status === 'unplayed') {
    tips.push(<li key="playerCount">{Object.keys(state.players).length} joueur(s) disponibles</li>);
  }
  return <div id="gameMasterControls">
  <h2>Actions</h2>
  <div id="buttons">
    {actions}
  </div>
  <h2>Info</h2>
  <ul>
    {tips}
  </ul>
  </div>;
}
