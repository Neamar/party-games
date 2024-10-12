import { useContext } from 'react';
import { State, WebsocketContext } from './App';

export default function GameMasterControls({state}:{state:State}) {
  const sendMessage = useContext(WebsocketContext);
  const actions = [
    <button onClick={() => sendMessage('shuffle', {})}>Shuffle tables</button>
  ];

  if(state.status === 'picking') {
    actions.push(<>
    <select defaultValue={state.correctPick} onChange={(e) => sendMessage('correctPick', {correctPick: e.target.value})}>
        <option value="">Pick one...</option>
        {state.pickOptions.map((pickOption) => <option value={pickOption} key={pickOption}>{pickOption}</option>)}
      </select>
      <button onClick={() => sendMessage('status', {status:'moving'})}>Validate answers</button>
    </>);
  }
  else {
    actions.push(<button onClick={() => sendMessage('status', {status:'picking'})}>Allow user to pick</button>);
  }

  return <div id="buttons">
    {actions}
  </div>
}
