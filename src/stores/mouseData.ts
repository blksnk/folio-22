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
}

export const useMouseData = defineStore("mouseData", {
  state: (): MouseProps => ({
    mousePos: { x: 0, y: 0 },
    targetMousePos: { x: 0, y: 0 },
    mouseDown: false,
    showCursor: false,
    cursorText: "Select",
    cursorIcon: "eye-outline",
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
