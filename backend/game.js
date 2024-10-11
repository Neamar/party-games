import { readFileSync, existsSync, writeFile } from 'fs';

/**
 * @typedef {object} Player
 * @property {string} id player public id
 * @property {string} name player name
 * @property {string} privateId player private id (should never be broadcast)
 *
 * @typedef {object} TablePlayer a player within a table
 * @property {string} id player id
 * @property {string?} pick player current pick
 *
 * @typedef {object} Table
 * @property {number} index
 * @property {TablePlayer[]} players
 *
 * @typedef {object} State
 * @property {"unstarted"|"picking"|"moving"} status
 * @property {Object.<string, Player>} players
 * @property {Table[]} tables
 */

class Game {
  id = 0;

  /**
   * @type {State}
   */
  state = {
    status: "moving",
    players: {},
    tables: Array(),
  }
  pathOnDisk = '';

  #ws = new Set();

  constructor(id) {

    this.id = id.replace(/[^0-9]/g, '');
    this.pathOnDisk = `/tmp/game-${id}.json`
    if (existsSync(this.pathOnDisk)) {
      this.state = JSON.parse(readFileSync(`/tmp/game-${id}.json`).toString())
    }
  }

  addConnection(ws) {
    this.#ws.add(ws);
    this.send(ws, "state", this.state);
  }

  removeConnection(ws) {
    this.#ws.delete(ws);
  }

  receive(message) {
    const { type, content } = JSON.parse(message);

    let requireBroadcast = false;
    const types = {
      'player': () => {
        // Add new player to the game
        if (this.state.players[content.id]) {
          // Trying to impersonate someone?
          return;
        }
        this.state.players[content.id] = content;
        const lastTable = this.state.tables?.[this.state.tables.length - 1];
        if (!lastTable || lastTable.players.length === 2) {
          this.state.tables.push({
            index: this.state.tables.length + 1,
            players: [{ id: content.id, pick: null }]
          })
        }
        else {
          lastTable.players.push({ id: content.id, pick: null });
        }

        requireBroadcast = true;
      },
      'pick': () => {
        // Pick a tile on the table
        const player = this.getPlayerByPrivateId(content.privateId);
        if (!player) {
          return;
        }
        requireBroadcast = this.state.tables.some(t => {
          return t.players.some(p => {
            if (p.id === player.id) {
              if (!t.players.some(t => t.pick === content.number)) {
                p.pick = content.number;
                return true;
              }
            }
          });
        });
      },
      'status': () => {
        this.state.status = content.status;
        requireBroadcast = true;
      }
    }

    types[type]();
    if (requireBroadcast) {
      this.broadcast("state", this.state);
    }
  }

  send(ws, type, content) {
    // Never send the privateId key
    ws.send(JSON.stringify(
      { type, content },
      (key, value) => key === 'privateId' ? undefined : value)
    );
  }

  broadcast(type, content) {
    this.#ws.forEach(ws => this.send(ws, type, content));
    writeFile(this.pathOnDisk, JSON.stringify(this.state), (err) => {
      if (err) {
        console.error(err)
      }
    });
  }

  getPlayerByPrivateId(privateId) {
    return Object.values(this.state.players).find(p => p.privateId === privateId);
  }
}

const knownGames = {};

/**
 *
 * @param {String} id will be neutered to a number
 * @returns {Game}
 */
export const getGameById = (id) => {
  id = id.replace(/[^0-9]/g, '');
  if (!knownGames[id]) {
    knownGames[id] = new Game(id);
  }

  return knownGames[id];
}
