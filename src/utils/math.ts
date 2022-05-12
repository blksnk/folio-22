import { Vector2 } from "./layout.types";

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function isBetween(v: number, min: number, max: number): boolean {
  return v > min && v < max;
}

export function largestAbsolute(n1: number, n2: number): number {
  return Math.abs(n1) > Math.abs(n2) ? n1 : n2;
}

export function getScaleCoef(offset: Vector2): number {
  const sum = offset.x + offset.y;
  const scaleCoef = clamp((1 - sum / 2 + 0.5) * 1.5, 0.5, 1);
  return scaleCoef;
}

export const isNegative = (n: number): boolean => n - Math.abs(n) > 0;

export const diffLessThan = (a: number, b: number, diff: number): boolean =>
  Math.abs(a - b) < diff;
