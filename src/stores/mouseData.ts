import { Vector2 } from "@/utils/layout.types";
import { defineStore } from "pinia";

export interface MouseProps {
  [k: string]: any;
  mousePos: Vector2;
  targetMousePos: Vector2;
  lastMousePos: Vector2;
  mouseDown: boolean;
  hasMoved: boolean;
  showCursor: boolean;
  cursorText: string | undefined;
  cursorIcon: string | undefined;
  isTouch: boolean;
  transparent: boolean;
}

export const useMouseData = defineStore("mouseData", {
  state: (): MouseProps => ({
    mousePos: { x: window.innerWidth / 2, y: window.innerHeight + 100 },
    targetMousePos: { x: window.innerWidth / 2, y: window.innerHeight + 100 },
    lastMousePos: { x: window.innerWidth / 2, y: window.innerHeight + 100 },
    mouseDown: false,
    hasMoved: false,
    showCursor: false,
    cursorText: "Select",
    cursorIcon: "eye-outline",
    isTouch: false,
    transparent: false,
  }),
  getters: {
    normalizedMousePos: (state): Vector2 => ({
      x: (state.mousePos.x / window.innerWidth - 0.5) * 2,
      y: (state.mousePos.y / window.innerHeight - 0.5) * 2,
    }),
    mouseDelta: (state): Vector2 => ({
      x: state.targetMousePos.x - state.mousePos.x,
      y: state.targetMousePos.y - state.mousePos.y,
    }),
  },
  actions: {
    setMousePos(newVec: Vector2) {
      this.mousePos = newVec;
    },
    updateStore(key: string, v: unknown) {
      this[key] = v;
    },
  },
});
