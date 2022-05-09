import { Vector2 } from "@/utils/layout.types";
import { defineStore } from "pinia";

export interface MouseProps {
  [k: string]: any;
  mousePos: Vector2;
  targetMousePos: Vector2;
  mouseDown: boolean;
  showCursor: boolean;
  cursorText: string;
  cursorIcon: string | undefined;
  isTouch: boolean;
}

export const useMouseData = defineStore("mouseData", {
  state: (): MouseProps => ({
    mousePos: { x: window.innerWidth / 2, y: window.innerHeight + 100 },
    targetMousePos: { x: window.innerWidth / 2, y: window.innerHeight + 100 },
    mouseDown: false,
    showCursor: false,
    cursorText: "Select",
    cursorIcon: "eye-outline",
    isTouch: false,
  }),
  getters: {
    normalizedMousePos: (state) => ({
      x: (state.mousePos.x / window.innerWidth - 0.5) * 2,
      y: (state.mousePos.y / window.innerHeight - 0.5) * 2,
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
