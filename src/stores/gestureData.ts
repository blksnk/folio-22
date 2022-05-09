import { Vector2 } from "@/utils/layout.types";
import { defineStore } from "pinia";

export interface GestureProps {
  [k: string]: any;
  scrollPos: Vector2;
  targetScrollPos: Vector2;
  scrollMax: Vector2;
}

export const useGestureData = defineStore("gestureData", {
  state: (): GestureProps => ({
    scrollPos: { x: 0, y: 0 },
    targetScrollPos: { x: 0, y: 0 },
    scrollMax: { x: 0, y: window.innerHeight },
  }),
  getters: {},
  actions: {
    setScrollPos(newVec: Vector2) {
      this.scrollPos = {
        x: Math.max(Math.min(newVec.x, this.scrollMax.x), 0),
        y: Math.max(Math.min(newVec.y, this.scrollMax.y), 0),
      };
    },
    incrementScrollPos(newVec: Vector2) {
      this.scrollPos = {
        x: Math.max(Math.min(newVec.x + this.scrollPos.x, this.scrollMax.x), 0),
        y: Math.max(Math.min(newVec.y + this.scrollPos.y, this.scrollMax.y), 0),
      };
    },
    setTargetScrollPos(deltas: Vector2) {
      this.targetScrollPos.x = Math.max(
        Math.min(this.scrollMax.x, deltas.x + this.targetScrollPos.x),
        0
      );
      this.targetScrollPos.y = Math.max(
        Math.min(this.scrollMax.y, deltas.y + this.targetScrollPos.y),
        0
      );
    },
    updateStore(key: string, v: unknown) {
      this[key] = v;
    },
    setScrollMax(update: { x?: number; y?: number }) {
      this.scrollMax = {
        ...this.scrollMax,
        ...update,
      };
    },
  },
});
