export type PlayerId = string;
export type PlayerPrivateId = string;

export type Player = {
  name: string;
  id: PlayerId;
  privateId?: PlayerPrivateId;
};

export type FullPlayer = Player & { privateId: PlayerPrivateId };

export type TablePlayer = {
  id: PlayerId;
  pick: string | null;
};

export type Table = {
  players: TablePlayer[];
};

export type GameStatus = "unplayed" | "picking" | "moving";

export type State = {
  players: {
    [id: PlayerId]: Player;
  };
  tables: Table[];
  pickOptions: string[];
  correctPick: string | null;
  status: GameStatus;
};

export type WSAddPlayerMessage = {
  type: "addPlayer";
  name: string;
  id: PlayerId;
  privateId: PlayerPrivateId;
};

export type WSSetPlayerPickMessage = {
  type: "setPlayerPick";
  privateId?: PlayerPrivateId;
  pick: string;
};

export type WSSetGameStatus = {
  type: "setGameStatus";
  privateId?: PlayerPrivateId;
  status: GameStatus;
};

export type WSSetCorrectPick = {
  type: "setCorrectPick";
  privateId?: PlayerPrivateId;
  correctPick: string | null;
};

export type WSShuffleTables = {
  type: "shuffleTables";
  privateId?: PlayerPrivateId;
};

export type WSClientToServerMessage =
  | WSAddPlayerMessage
  | WSSetPlayerPickMessage
  | WSSetGameStatus
  | WSSetCorrectPick
  | WSShuffleTables;

export type SendClientMessage = (message: WSClientToServerMessage) => void;
