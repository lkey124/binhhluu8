export enum GamePhase {
  PROFILE = 'PROFILE',
  WELCOME = 'WELCOME',
  HOST_SETUP = 'HOST_SETUP',
  JOIN_ROOM = 'JOIN_ROOM',
  PLAYING = 'PLAYING',
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface GameData {
  topic: string;
  word: string;
  liarIndex: number; // 1-based index
  totalPlayers: number;
  timestamp: number;
}

export interface TopicCategory {
  id: string;
  name: string;
  words: string[];
}
