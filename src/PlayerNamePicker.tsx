import { useEffect, useRef } from 'react';

export default function PlayerNamePicker({handleCurrentPlayerName}) {
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
