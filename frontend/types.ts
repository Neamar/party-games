export type Player = {
  name: string;
  id: string;
  privateId?: string;
};

export type TablePlayer = {
  id: string;
  pick: string | null;
};

export type Table = {
  players: TablePlayer[];
};
export type State = {
  players: {
    [id: string]: Player;
  };
  tables: Table[];
  pickOptions: string[];
  correctPick: string | null;
  status: "unplayed" | "picking" | "moving";
};
