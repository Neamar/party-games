import { useContext } from 'react';
import { State, WebsocketContext } from './App';

export default function GameMasterControls({state}:{state:State}) {
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
