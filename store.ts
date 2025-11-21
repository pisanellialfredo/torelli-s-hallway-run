
import { create } from 'zustand';
import { GameState, ObstacleType, SegmentData, SEGMENT_LENGTH, VISIBLE_SEGMENTS } from './types';
import { generateUUID } from 'three/src/math/MathUtils';

interface GameStore {
  gameState: GameState;
  score: number;
  coins: number;
  speed: number;
  segments: SegmentData[];
  
  // Actions
  startGame: () => void;
  endGame: () => void;
  collectCoin: () => void;
  updateScore: (delta: number) => void;
  recycleSegment: () => void;
  reset: () => void;
}

const COLLEGE_NAMES = [
  "Collegio Castiglioni", 
  "Collegio Nuovo", 
  "Collegio Senatore", 
  "Collegio Valla", 
  "LA CIGNA"
];

const generateRandomSegment = (z: number): SegmentData => {
  const lanes = [ObstacleType.NONE, ObstacleType.NONE, ObstacleType.NONE];
  const coins = [false, false, false];
  const highWallTexts = [null, null, null] as (string | null)[];
  
  // Randomly place obstacles
  // Ensure at least one lane is open
  const openLane = Math.floor(Math.random() * 3);
  
  for (let i = 0; i < 3; i++) {
    if (i === openLane) {
      // Chance for coin in open lane
      coins[i] = Math.random() > 0.5;
      continue;
    }

    const rand = Math.random();
    if (rand > 0.7) {
      lanes[i] = ObstacleType.PILLAR;
    } else if (rand > 0.5) {
      lanes[i] = ObstacleType.WALL_LOW;
    } else if (rand > 0.4) {
      lanes[i] = ObstacleType.WALL_HIGH;
      highWallTexts[i] = COLLEGE_NAMES[Math.floor(Math.random() * COLLEGE_NAMES.length)];
    } else {
       // Empty lane
       coins[i] = Math.random() > 0.5;
    }
  }

  // Random decoration for the right wall
  // 0: None (sometimes empty), 1: Door, 2: Notice Board, 3: Fire Ext, 4: Poster
  // Weight "None" higher so walls aren't too cluttered
  const decRand = Math.random();
  let decorationVariant = 0;
  if (decRand > 0.8) decorationVariant = 1;
  else if (decRand > 0.6) decorationVariant = 2;
  else if (decRand > 0.5) decorationVariant = 3;
  else if (decRand > 0.4) decorationVariant = 4;

  return {
    id: generateUUID(),
    z,
    lanes,
    coins,
    highWallTexts,
    decorationVariant,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MENU,
  score: 0,
  coins: 0,
  speed: 0,
  segments: [],

  startGame: () => {
    // Initialize segments
    const initialSegments: SegmentData[] = [];
    for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
      // First few segments empty for safe start
      if (i < 3) {
        initialSegments.push({
          id: generateUUID(),
          z: -i * SEGMENT_LENGTH,
          lanes: [0,0,0],
          coins: [false, false, false],
          highWallTexts: [null, null, null],
          decorationVariant: 0
        });
      } else {
        initialSegments.push(generateRandomSegment(-i * SEGMENT_LENGTH));
      }
    }

    set({
      gameState: GameState.PLAYING,
      score: 0,
      coins: 0,
      speed: 10, // Initial speed
      segments: initialSegments,
    });
  },

  endGame: () => {
    set({ gameState: GameState.GAME_OVER, speed: 0 });
  },

  collectCoin: () => {
    set((state) => ({ coins: state.coins + 1, score: state.score + 50 }));
  },

  updateScore: (delta) => {
    set((state) => ({ score: state.score + delta }));
  },

  recycleSegment: () => {
    const { segments, speed } = get();
    const lastZ = segments[segments.length - 1].z;
    const newSegment = generateRandomSegment(lastZ - SEGMENT_LENGTH);
    
    // Increase speed progressively
    // Base starts at 10. Cap at 25.
    // Increase by 0.1 per segment.
    const newSpeed = Math.min(25, speed + 0.1);
    
    // Remove first, add new to end
    set({
      segments: [...segments.slice(1), newSegment],
      speed: newSpeed
    });
  },

  reset: () => {
    set({
      gameState: GameState.MENU,
      score: 0,
      coins: 0,
      speed: 0,
    });
  }
}));
