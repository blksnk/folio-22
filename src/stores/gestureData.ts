import { getScreenDims } from "@/utils/layout";
import { Vector2, ScreenDims } from "@/utils/layout.types";
import { defineStore } from "pinia";
import { reactive } from "vue";

export interface GestureProps {
  [k: string]: any;
  scrollPos: Vector2;
  targetScrollPos: Vector2;
  scrollMax: Vector2;
  velocity: Vector2;
  transformPosition: Vector2;
  translating: boolean;
  zoomTarget: number;
  preTranslateZoomTarget: number;
  zoomFactor: number;
  dragDezooming: boolean;
  MIN_MOVE_FACTOR: number;
  DRAG_FACTOR: number;
  screenSize: ScreenDims;
}

export const useGestureData = defineStore("gestureData", {
  state: (): GestureProps => ({
    scrollPos: { x: 0, y: 0 },
    targetScrollPos: { x: 0, y: 0 },
    scrollMax: { x: 0, y: window.innerHeight },
    velocity: { x: 0, y: 0 },
    transformPosition: { x: 0, y: 0},
    translating: false,
    zoomTarget: 0.1,
    preTranslateZoomTarget: 0.1,
    zoomFactor: 0.1,
    MIN_MOVE_FACTOR: 0.55,
    DRAG_FACTOR: 0.9,
    dragDezooming: false,
    screenSize: getScreenDims(),
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
    applyZoom() {
      this.zoomFactor += (this.zoomTarget - this.zoomFactor) * 0.05;
    },
    decreaseVelocity() {
      const f = this.translating ? this.DRAG_FACTOR : 0;
      this.velocity.x *= f;
      this.velocity.y *= f;
    },
  },
});

export const velocity = reactive<Vector2>({
  x: 0,
  y: 0,
});
