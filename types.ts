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
  profile?: UserProfile; // Synced profile data
  isReady?: boolean; // For the reveal phase sync
}

export interface TopicCategory {
  id: string;
  name: string;
  words: string[];
}

// --- P2P Message Types ---
export type P2PMessage = 
  | { type: 'SYNC_STATE'; payload: any } // Host sends full state to guests
  | { type: 'JOIN_REQUEST'; payload: UserProfile } // Guest -> Host (Not used directly via data, implicit via connection)
  | { type: 'SIT_REQUEST'; payload: { seatIndex: number; profile: UserProfile } } // Guest -> Host
  | { type: 'PLAYER_READY'; payload: { seatIndex: number } } // Guest -> Host (Finished revealing)
  | { type: 'ACTION_VOTE'; payload: { voterSeat: number; targetSeat: number } } // Guest -> Host
  | { type: 'HOST_PHASE_CHANGE'; payload: { phase: TurnPhase; data?: any } }; // Host -> Guests