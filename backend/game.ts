import uWS from "uWebSockets.js";
import { readFileSync, existsSync, writeFile } from "fs";
import {
  State,
  Table,
  WSAddPlayerMessage,
  WSClientToServerMessage,
  WSRemovePlayer,
  WSSetCorrectPick,
  WSSetGameStatus,
  WSSetPlayerPickMessage,
  WSShuffleTables,
} from "../types.ts";
import { WsUserData } from "./index.ts";
import assert from "assert";

class Game {
  id = "0";

  state: State = {
    status: "unplayed",
    pickOptions: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    correctPick: null,
    players: {},
    tables: [],
  };
  pathOnDisk = "";

  #ws = new Set<uWS.WebSocket<WsUserData>>();

  constructor(id: string) {
    this.id = id.replace(/[^0-9]/g, "");
    this.pathOnDisk = `/tmp/game-${id}.json`;
    if (existsSync(this.pathOnDisk)) {
      this.state = JSON.parse(readFileSync(`/tmp/game-${id}.json`).toString());
    }
  }

  addConnection(ws: uWS.WebSocket<WsUserData>) {
    this.#ws.add(ws);
    this.send(ws, "state", this.state);
  }

  removeConnection(ws: uWS.WebSocket<WsUserData>) {
    this.#ws.delete(ws);
  }

  receive(message: WSClientToServerMessage) {
    const state = this.state;

    const types = {
      addPlayer: (message: WSAddPlayerMessage) => {
        // Add new player to the game
        assert(!state.players[message.id], "User already registered");

        state.players[message.id] = {
          id: message.id,
          privateId: message.privateId,
          name: message.name,
        };

        const lastTable = state.tables?.[state.tables.length - 1];
        if (!lastTable || lastTable.players.length === 2) {
          state.tables.push({
            players: [{ id: message.id, pick: null }],
          });
        } else {
          lastTable.players.push({ id: message.id, pick: null });
        }

        return true;
      },
      setPlayerPick: (message: WSSetPlayerPickMessage) => {
        assert(state.status === "picking", "State must be picking");

        // Pick a tile on the table
        const player = this.getPlayerByPrivateId(message.privateId);
        assert(player, "Invalid player id");

        return state.tables.some((t) => {
          return t.players.some((p) => {
            if (p.id === player.id) {
              if (!t.players.some((t) => t.pick === message.pick)) {
                p.pick = message.pick;
                return true;
              }
            }
          });
        });
      },
      setGameStatus: (message: WSSetGameStatus) => {
        const state = this.state;
        state.status = message.status;

        if (state.status === "moving" && state.correctPick) {
          /**
           * apply the actual up and down,
           * initialize new tables
           * @type Table[]
           */
          const newTables: Table[] = state.tables.map(() => ({ players: [] }));
          state.tables.forEach((table, index) => {
            // find winner on table
            if (table.players.length === 1) {
              // Only one at the table! ez, you win
              table.players[0].pick = null;
              newTables[Math.max(0, index - 1)].players.push(table.players[0]); // you go up
            } else {
              const winnerIndex =
                table.players[0].pick === state.correctPick ? 0 : 1;
              table.players[0].pick = null;
              table.players[1].pick = null;
              newTables[Math.max(0, index - 1)].players.push(
                table.players[winnerIndex]
              ); // you go up
              newTables[Math.min(newTables.length - 1, index + 1)].players.push(
                table.players[1 - winnerIndex]
              ); // you go down
            }
          });
          state.tables = newTables;
          // Reset picks
          state.correctPick = null;
        }
        return true;
      },
      setCorrectPick: (message: WSSetCorrectPick) => {
        state.correctPick = message.correctPick;
        return true;
      },
      shuffleTables: (_message: WSShuffleTables) => {
        const tables = state.tables;
        for (let i = tables.length - 1; i >= 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tables[i], tables[j]] = [tables[j], tables[i]];
        }
        return true;
      },
      removePlayer: (message: WSRemovePlayer) => {
        delete state.players[message.id];
        state.tables = state.tables
          .map((t) => t.players)
          .flat(1)
          .filter((p) => p.id !== message.id)
          .reduce((t: Table[], p) => {
            if (t.length === 0 || t.at(-1).players.length === 2) {
              t.push({ players: [] });
            }

            t.at(-1).players.push(p);
            return t;
          }, []);
        return true;
      },
    };

    console.log("Handling message", message);
    if (message.type in types) {
      // @ts-expect-error message can't be typed properly
      const requireBroadcast = types[message.type](message);
      if (requireBroadcast) {
        this.broadcast("state", state);
      }
    }
  }

  send(ws: uWS.WebSocket<WsUserData>, type: string, content) {
    // Never send the privateId key
    ws.send(
      JSON.stringify({ type, content }, (key, value) =>
        key === "privateId" ? undefined : value
      )
    );
  }

  broadcast(type: string, content) {
    this.#ws.forEach((ws) => this.send(ws, type, content));
    writeFile(this.pathOnDisk, JSON.stringify(this.state), (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  getPlayerByPrivateId(privateId: string) {
    return Object.values(this.state.players).find(
      (p) => p.privateId === privateId
    );
  }
}

const knownGames: Record<string, Game> = {};

/**
 *
 * @param {String} id will be neutered to a number
 * @returns {Game}
 */
export const getGameById = (id: string) => {
  id = id.replace(/[^0-9]/g, "");
  if (!knownGames[id]) {
    knownGames[id] = new Game(id);
  }

  return knownGames[id];
};
