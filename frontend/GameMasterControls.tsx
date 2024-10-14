import { Fragment, useContext } from 'react';
import { WebsocketContext } from './main';
import { State } from './types';

export default function GameMasterControls({state}:{state:State}) {
  const sendMessage = useContext(WebsocketContext);
  const actions = [
    <button key="shuffle" onClick={() => sendMessage('shuffle', {})}>Shuffle tables</button>
  ];

  if(state.status === 'picking') {
    actions.push(<Fragment key="picking">
    <select defaultValue={state.correctPick} onChange={(e) => sendMessage('correctPick', {correctPick: e.target.value})}>
        <option value="">Pick one...</option>
        {state.pickOptions.map((pickOption) => <option value={pickOption} key={pickOption}>{pickOption}</option>)}
      </select>
      <button onClick={() => sendMessage('status', {status:'moving'})}>Validate answers</button>
      <button onClick={() => sendMessage('status', {status:'unplayed'})}>Back to start</button>
    </Fragment>);
  }
  else {
    actions.push(<button key="moving" onClick={() => sendMessage('status', {status:'picking'})}>Allow user to pick</button>);
  }

  let tips = [];
  if(state.status === 'picking') {
    if(state.correctPick) {
      tips = state.tables.filter((t) => t.players[0].pick != state.correctPick && (t.players.length === 1 || t.players[1].pick != state.correctPick)).map(t => {
        if(t.players.length === 1)
          return <li key={t.players[0].id}>{state.players[t.players[0].id].name} hasn't picked the correct answer yet</li>;
        else
          return <li key={t.players[0].id}>{state.players[t.players[0].id].name} / {state.players[t.players[1].id].name} haven't picked the correct answer yet</li>;
    });
    }
    else {
      const tablePlayers = state.tables.map(t => t.players).flat(1);
      tips = tablePlayers.filter(player => !player.pick).map(player => <li key={player.id}>{state.players[player.id].name} hasn't picked anything yet</li>);
    }
  }
  return <>
  <div id="buttons">
    {actions}
  </div>
  <ul>
    {tips}
  </ul>
  </>;
}
