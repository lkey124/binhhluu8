import { GameData } from '../types';
import { STATIC_TOPICS } from '../constants';

// --- Constants for Bit Packing ---
const MIN_PLAYERS = 5;
// Multipliers derived from max values:
// Players (5-12) -> 8 possibilities (3 bits)
// Liar (1-12) -> 12 possibilities (4 bits)
// Topic (0-5) -> 6 possibilities (3 bits)
// Words (0-9) -> 10 possibilities (4 bits)

export const encodeGameData = (data: GameData): string => {
  // 1. Try to pack into 5-digit code (Only for Standard Topics)
  const topicIndex = STATIC_TOPICS.findIndex(t => t.name === data.topic);
  
  if (topicIndex !== -1) {
    const topic = STATIC_TOPICS[topicIndex];
    const wordIndex = topic.words.indexOf(data.word);
    
    // Only pack if word exists in standard list
    if (wordIndex !== -1) {
      // Pack Data:
      // p: players offset (0-7)
      // l: liar offset (0-11)
      // t: topic index (0-5)
      // w: word index (0-9)
      
      const p = data.totalPlayers - MIN_PLAYERS;
      const l = data.liarIndex - 1;
      const t = topicIndex;
      const w = wordIndex;

      // Formula: val = p + (l * 8) + (t * 96) + (w * 576)
      // Max value approx: 7 + 88 + 480 + 5184 = ~5759
      let packed = p + (l * 8) + (t * 96) + (w * 576);
      
      // Add a base offset to make it look like a random 5-digit ID (starts from 10000)
      // We add a salt to make it less obvious
      packed += 13579; 

      return packed.toString();
    }
  }

  // 2. Fallback to Long Code (Base64) for Custom/AI Topics
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

  // 1. Try to unpack 5-digit code
  // Regex to check if it's a 5-digit number
  if (/^\d{5}$/.test(code)) {
    try {
      let val = parseInt(code, 10);
      val -= 13579; // Remove offset

      if (val < 0) return null;

      // Reverse the packing math
      // p = val % 8
      // l = (val / 8) % 12
      // t = (val / 96) % 6
      // w = (val / 576) % 10 (approx)

      const p = val % 8;
      const l = Math.floor(val / 8) % 12;
      const t = Math.floor(val / 96) % 6;
      const w = Math.floor(val / 576);

      const topicData = STATIC_TOPICS[t];
      if (!topicData) return null;

      const totalPlayers = p + MIN_PLAYERS;
      const liarIndex = l + 1;
      const word = topicData.words[w];

      if (!word) return null;

      return {
        topic: topicData.name,
        word: word,
        liarIndex: liarIndex,
        totalPlayers: totalPlayers,
        timestamp: Date.now() // Timestamp is approximated for joiners
      };

    } catch (e) {
      console.error("Error unpacking short code", e);
      // Fall through to try base64
    }
  }

  // 2. Fallback to Base64 decode
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

export const generateRandomLiar = (totalPlayers: number): number => {
  return Math.floor(Math.random() * totalPlayers) + 1;
};

export const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};