export enum GamePhase {
  PROFILE = 'PROFILE',
  WELCOME = 'WELCOME',
  HOST_SETUP = 'HOST_SETUP',
  PLAYING = 'PLAYING',
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export enum Role {
  CIVILIAN = 'CIVILIAN', // Dân thường
  LIAR = 'LIAR',         // Kẻ nói dối
  WHITE_HAT = 'WHITE_HAT' // Mũ trắng (Không biết gì cả)
}

export interface GameData {
  topic: string;
  word: string;
  totalPlayers: number;
  liarCount: number;
  whiteHatCount: number;
  timestamp: number;
  // Roles are derived deterministically from the code/seed, not stored explicitly
}

export interface TopicCategory {
  id: string;
  name: string;
  words: string[];
}