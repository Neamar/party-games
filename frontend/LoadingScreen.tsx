import './LoadingScreen.css';
import { Player } from '../types';

export default function LoadingScreen({players, currentPlayer}:{players:Player[], currentPlayer:Player}) {
  return <>
    <h2>Le jeu va bientôt commencer...</h2>
    <p>Partagez ce lien avec des amis pour qu'ils nous rejoignent : {document.location.toString()}</p>

    <ul className="playerList">
      {players.map((player) => <li key={player.id}>{player.name} {player.id === currentPlayer.id && '(toi !)'}</li>)}
    </ul>
    </>;
}
