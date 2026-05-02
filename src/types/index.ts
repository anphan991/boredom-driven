export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export interface Bird {
  y: number;
  velocity: number;
  rotation: number;
}

export interface Pipe {
  x: number;
  gapTop: number;
  passed: boolean;
  moveType: 'none' | 'sine';
  baseY: number;
  angle: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}