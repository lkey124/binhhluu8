export enum GamePhase {
  PROFILE = 'PROFILE',
  WELCOME = 'WELCOME',
  HOST_SETUP = 'HOST_SETUP',
  PLAYING = 'PLAYING', // General container, internal phases handled in App state
}

export enum TurnPhase {
  LOBBY = 'LOBBY',
  REVEAL = 'REVEAL',
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
}

export interface PlayerState {
  seatIndex: number; // 0-based
  status: 'ALIVE' | 'ELIMINATED';
  role?: Role; // Only visible if revealed/eliminated
}

export interface TopicCategory {
  id: string;
  name: string;
  words: string[];
}