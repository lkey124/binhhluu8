import { GameData, Role } from '../types';
import { STATIC_TOPICS } from '../constants';

const MIN_PLAYERS = 5;

// --- Seeded RNG (Linear Congruential Generator) ---
// Allows us to generate the exact same "Random" sequence on every device sharing the same Code
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns number between 0 and 1
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Fisher-Yates shuffle using our seeded RNG
function shuffle<T>(array: T[], rng: SeededRNG): T[] {
  let currentIndex = array.length,  randomIndex;
  const newArray = [...array];

  while (currentIndex !== 0) {
    randomIndex = Math.floor(rng.next() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
}

export const encodeGameData = (data: GameData): string => {
  // 1. Try to pack into 5-digit code
  const topicIndex = STATIC_TOPICS.findIndex(t => t.name === data.topic);
  
  if (topicIndex !== -1) {
    const topic = STATIC_TOPICS[topicIndex];
    const wordIndex = topic.words.indexOf(data.word);
    
    if (wordIndex !== -1) {
      // Packing Schema (Total ~ 5759 max val, fits in 5 digits):
      // Players (5-12) -> 8 opts (3 bits) | val: 0-7
      // LiarCount (1-4) -> 4 opts (2 bits) | val: 0-3
      // WhiteHat (0-2) -> 3 opts (2 bits) | val: 0-2
      // Topic (0-5) -> 6 opts (3 bits) | val: 0-5
      // Word (0-9) -> 10 opts (4 bits) | val: 0-9
      
      const p = data.totalPlayers - MIN_PLAYERS;
      const lc = data.liarCount - 1; 
      const wh = data.whiteHatCount; 
      const t = topicIndex;
      const w = wordIndex;

      // Formula with multipliers
      // Val = p + (lc * 8) + (wh * 32) + (t * 96) + (w * 576)
      let packed = p + (lc * 8) + (wh * 32) + (t * 96) + (w * 576);
      
      // Add salt/offset to make it look like a code (starts ~10000)
      packed += 14285; 

      return packed.toString();
    }
  }

  // 2. Fallback to Base64
  try {
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return base64.replace(/=+$/, '');
  } catch (e) {
    console.error("Error encoding game data", e);
    return '';
  }
};

export const decodeGameData = (code: string): GameData | null => {
  if (!code) return null;

  // 1. Unpack 5-digit code
  if (/^\d{5}$/.test(code)) {
    try {
      let val = parseInt(code, 10);
      val -= 14285;

      if (val < 0) return null;

      // Unpack logic (Reverse multipliers)
      // p = val % 8
      // lc = (val / 8) % 4
      // wh = (val / 32) % 3
      // t = (val / 96) % 6
      // w = (val / 576)
      
      const p = val % 8;
      const lc = Math.floor(val / 8) % 4;
      const wh = Math.floor(val / 32) % 3;
      const t = Math.floor(val / 96) % 6;
      const w = Math.floor(val / 576);

      const topicData = STATIC_TOPICS[t];
      if (!topicData) return null;

      return {
        topic: topicData.name,
        word: topicData.words[w],
        totalPlayers: p + MIN_PLAYERS,
        liarCount: lc + 1,
        whiteHatCount: wh,
        timestamp: Date.now()
      };

    } catch (e) {
      console.error("Error unpacking short code", e);
    }
  }

  // 2. Base64 Fallback
  try {
    const padding = code.length % 4;
    const paddedCode = padding > 0 ? code + '='.repeat(4 - padding) : code;
    const jsonStr = decodeURIComponent(escape(atob(paddedCode)));
    return JSON.parse(jsonStr) as GameData;
  } catch (e) {
    console.error("Error decoding game data", e);
    return null;
  }
};

// Deterministically get roles based on the Room Code (Seed)
export const getRolesForGame = (gameData: GameData, roomCode: string): Role[] => {
  // Create pool of roles
  const roles: Role[] = [];
  
  // Add Liars
  for (let i = 0; i < gameData.liarCount; i++) roles.push(Role.LIAR);
  
  // Add White Hats
  for (let i = 0; i < gameData.whiteHatCount; i++) roles.push(Role.WHITE_HAT);
  
  // Fill rest with Civilians
  while (roles.length < gameData.totalPlayers) roles.push(Role.CIVILIAN);

  // Parse seed from code
  let seed = 0;
  if (/^\d{5}$/.test(roomCode)) {
    seed = parseInt(roomCode, 10);
  } else {
    // Hash string for custom codes
    for (let i = 0; i < roomCode.length; i++) {
      seed = ((seed << 5) - seed) + roomCode.charCodeAt(i);
      seed |= 0;
    }
  }

  // Shuffle using seed
  const rng = new SeededRNG(seed);
  return shuffle(roles, rng);
};

export const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};