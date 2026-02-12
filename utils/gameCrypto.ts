
import { GameData, Role } from '../types';

// Standard Fisher-Yates shuffle using Math.random
export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
}

// Generate roles based on game configuration
export const getRolesForGame = (gameData: GameData): Role[] => {
  // Create pool of roles
  const roles: Role[] = [];
  
  // 1. Add Liars
  // Ensure we interpret the count as a number
  const liarCount = Number(gameData.liarCount) || 1;
  for (let i = 0; i < liarCount; i++) {
    roles.push(Role.LIAR);
  }
  
  // 2. Add White Hats
  const whiteHatCount = Number(gameData.whiteHatCount) || 0;
  for (let i = 0; i < whiteHatCount; i++) {
    roles.push(Role.WHITE_HAT);
  }
  
  // 3. Fill rest with Civilians
  const totalPlayers = Number(gameData.totalPlayers) || 5;
  while (roles.length < totalPlayers) {
    roles.push(Role.CIVILIAN);
  }

  // 4. Shuffle reliably
  return shuffle(roles);
};

export const getRandomWord = (words: string[]): string => {
  if (!words || words.length === 0) return "Hết từ";
  return words[Math.floor(Math.random() * words.length)];
};
