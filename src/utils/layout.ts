export interface Vector2 {
  [key: string]: number | Vector2;
  x: number;
  y: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const WINDOW_WIDTH = window.innerWidth < 600 ? 250 : 500;

export const createWindowTransformStyle = (
  transform: Transform,
  windowCenter: Vector2,
  velocity: Vector2
): string => {
  const x = transform.x - windowCenter.x;
  const y = transform.y - windowCenter.y; // offset to center window in frame;
  const scale = transform?.scale || 1;
  return `transform: translate3d(${x}px, ${y}px, 0px) scale(${scale}, ${scale}) skew(${
    velocity.x / 15
  }deg, ${velocity.y / 15}deg);`;
};


export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function isBetween(v: number, min: number, max: number): boolean {
  return v > min && v < max;
}

export function largestAbsolute(n1: number, n2: number): number {
  return Math.abs(n1) > Math.abs(n2) ? n1 : n2;
}