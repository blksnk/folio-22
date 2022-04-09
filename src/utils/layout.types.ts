import { Project, ImageFormats } from "@/utils/api.types";

export interface Vector2 {
  [key: string]: number | Vector2;
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

export interface Transform extends Vector2 {
  scale: number;
}

export type Boundary = {
  [k: string]: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export interface WindowPosition extends Boundary {
  width: number;
  height: number;
}

export interface ScreenDims extends Vector2 {
  center: Vector2;
  ratio: number;
}

export interface WindowData {
  transform: Transform;
  targetTransform: Transform;
  title: string;
  id: number | string;
  selected: boolean;
  thumbnail: ImageFormats;
  initialPosition: Vector2;
  transformPreZoom: Vector2;
  open: boolean;
  hidden: boolean;
}
