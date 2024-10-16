import { useEffect, useRef } from 'react';

export default function PlayerNamePicker({handleCurrentPlayerName, setSpectatorMode}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    handleCurrentPlayerName(event.currentTarget.elements['player-name'].value);
  }

  return <dialog ref={dialogRef}>
    <h1>Bienvenue !</h1>
    <p>Pour commencer, choisissez votre pseudo.</p>
    <form onSubmit={handleSubmit}>
      <input type="text" id="player-name"/>
      <input type="submit" value="Commencer" />
    </form>
    <button onClick={() => setSpectatorMode(true)}>Je veux juste être un spectateur</button>
  </dialog>;
}
