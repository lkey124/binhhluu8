
export enum GamePhase {
  SETUP = 'SETUP', // Config players, topic
  NAME_SETUP = 'NAME_SETUP', // Enter names
  PLAYING = 'PLAYING', // Main game loop
}

export enum TurnPhase {
  REVEAL = 'REVEAL', // Pass and play reveal
  DESCRIBING = 'DESCRIBING',
  VOTING = 'VOTING',
  ELIMINATION = 'ELIMINATION',
  GAME_OVER = 'GAME_OVER'
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export enum Role {
  CIVILIAN = 'CIVILIAN',
  LIAR = 'LIAR',
  WHITE_HAT = 'WHITE_HAT'
}

export interface GameData {
  topic: string;
  word: string;
  totalPlayers: number;
  liarCount: number;
  whiteHatCount: number;
  timestamp: number;
}

export interface PlayerState {
  seatIndex: number;
  name: string;
  avatar: string;
  status: 'ALIVE' | 'ELIMINATED';
  role: Role; // In local mode, we store role directly but hide it in UI
}

export interface TopicCategory {
  id: string;
  name: string;
  words: string[];
}

export interface P2PMessage {
  type: string;
  payload?: any;
  sender?: string;
  timestamp?: number;
}
