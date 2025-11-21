
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum ObstacleType {
  NONE = 0,
  WALL_LOW = 1, // Jump over
  WALL_HIGH = 2, // Slide under
  PILLAR = 3, // Dodge (occupies lane)
}

export interface SegmentData {
  id: string;
  z: number;
  lanes: ObstacleType[]; // [Left, Center, Right]
  coins: boolean[]; // [Left, Center, Right]
  highWallTexts: (string | null)[]; // Text for high walls per lane
  decorationVariant: number; // 0: None, 1: Door, 2: Notice Board, 3: Fire Ext, 4: Poster
}

export const LANE_WIDTH = 2.5;
export const SEGMENT_LENGTH = 10;
export const VISIBLE_SEGMENTS = 12;
export const PLAYER_SPEED_BASE = 10;
