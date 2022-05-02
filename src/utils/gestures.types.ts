import { Ref } from "vue";
import { ScreenDims, Vector2 } from "./layout.types";

export interface GestureProps {
  onStartVector2: Vector2;
  onMoveVector2: Vector2;
  onWheelVector2: Vector2;
  onPinchVector2: Vector2;
  onTouchPositions: Vector2[];
  onEndVal: boolean;
}

export interface MouseProps {
  mousePos: Vector2;
  targetMousePos: Vector2;
  mouseDown: boolean;
  showCursor: boolean;
  cursorText: string;
  cursorIcon: string | undefined;
}

export type PageProps = {
  mousePos: Vector2;
  targetMousePos: Vector2;
  mouseDown: boolean;
  showCursor: boolean;
  cursorText: string;
  cursorIcon: string | undefined;
  onStartVector2: Vector2;
  onMoveVector2: Vector2;
  onWheelVector2: Vector2;
  onPinchVector2: Vector2;
  onTouchPositions: Vector2[];
  onEndVal: boolean;
  isMobile: boolean;
};
