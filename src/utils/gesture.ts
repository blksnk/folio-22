import { reactive } from "vue";
import { Vector2 } from '@/utils/layout'

type func = () => void;

type onTouchFunc = (touches: Vector2[]) => void;

type VectorArgFunc = (vec: Vector2, delta?: Vector2) => void;

interface GestureHandlerOptions {
  onStart: VectorArgFunc;
  onMove: VectorArgFunc;
  onTouch?: onTouchFunc;
  onPinch?: VectorArgFunc;
  onWheel?: VectorArgFunc;
  onEnd: func;
  target?: HTMLElement;
  preventDefault?: boolean;
}

class GestureHandler {
  onStart: VectorArgFunc;
  onMove: VectorArgFunc;
  onTouch?: onTouchFunc;
  onPinch?: VectorArgFunc;
  onWheel?: VectorArgFunc;
  onEnd: func;
  target: (Window & typeof globalThis) | HTMLElement = window;
  preventDefault = true;

  private touches: Touch[] = [];
  private touchPositions: Vector2[] = [];
  private oldTouches: Touch[] = [];
  private mousePos = reactive<Vector2>({ x: 0, y: 0 });
  private pinching = false;
  private multitouch = false;

  constructor(options: GestureHandlerOptions) {
    this.onStart = options.onStart;
    this.onMove = options.onMove;
    this.onEnd = options.onEnd;
    if (options.target) {
      this.target = options.target;
    }
    if (options.preventDefault) {
      this.preventDefault = options.preventDefault;
    }
    if (options.onTouch) {
      this.onTouch = options.onTouch;
    }
    if (options.onWheel) {
      this.onWheel = options.onWheel;
    }
    if(options.onPinch) {
      this.onPinch = options.onPinch;
    }

    this.init();
  }

  init() {
    this.target.addEventListener("mousedown", this._onMouseDown.bind(this));
    this.target.addEventListener("mouseup", this._onMouseUp.bind(this));
    this.target.addEventListener("mousemove", this._onMouseMove.bind(this));

    this.target.addEventListener("touchstart", this._onTouchStart.bind(this));
    this.target.addEventListener("touchend", this._onTouchEnd.bind(this));
    this.target.addEventListener("touchcancel", this._onTouchCancel.bind(this));
    this.target.addEventListener("touchleave", this._onTouchEnd.bind(this));
    this.target.addEventListener("touchmove", this._onTouchMove.bind(this), { passive: false });

    this.target.addEventListener("wheel", this._onWheel.bind(this));
  }

  destroy() {
    this.target.removeEventListener("mousedown", this._onMouseDown.bind(this));
    this.target.removeEventListener("mouseup", this._onMouseUp.bind(this));
    this.target.removeEventListener("mousemove", this._onMouseMove.bind(this));

    this.target.removeEventListener(
      "touchstart",
      this._onTouchStart.bind(this)
    );
    this.target.removeEventListener("touchend", this._onTouchEnd.bind(this));
    this.target.removeEventListener(
      "touchcancel",
      this._onTouchCancel.bind(this)
    );
    this.target.removeEventListener("touchleave", this._onTouchEnd.bind(this));
    this.target.removeEventListener("touchmove", this._onTouchMove.bind(this));
  }

  private prevent(e: Event) {
    if (this.preventDefault) {
      e.preventDefault();
    }
  }

  _onMouseDown(e: Event) {
    this.mousePos.x = (e as MouseEvent).clientX;
    this.mousePos.y = (e as MouseEvent).clientY;
    this.onStart(this.mousePos);
  }

  _onMouseUp() {
    this.onEnd();
  }

  _onMouseMove(e: Event) {
    this.prevent(e);
    const x = (e as MouseEvent).clientX;
    const y = (e as MouseEvent).clientY;
    const delta = {
      x: x - this.mousePos.x,
      y: y - this.mousePos.y,
    };
    this.mousePos.x = x;
    this.mousePos.y = y;
    this.onMove(this.mousePos, delta);
  }

  private getTouchPositions(touches: Touch[]): Vector2[] {
    return touches.map((touch: Touch) => {
      const { screenX, screenY } = touch;
      return { x: screenX, y: screenY };
    });
  }

  private removeTouches(e: Event) {
    const touches = (e as TouchEvent).changedTouches;
    for (let i = 0; i < touches.length; i++) {
      this.touches.splice(i, 1);
    }
  }

  private handleMultitouch() {
    if (this.touches.length === 2) {
      this.handlePinch();
    }
  }

  private handlePinch() {
    // calc diffs between touch positions
    const oldPositions = this.getTouchPositions(this.oldTouches);
    const oldDiff = {
      x: oldPositions[0].x - oldPositions[1].x,
      y: oldPositions[0].y - oldPositions[1].y,
    };
    const newDiff = {
      x: this.touchPositions[0].x - this.touchPositions[1].x,
      y: this.touchPositions[0].y - this.touchPositions[1].y,
    };

    // const pinchDelta = largestAbsolute(oldDiff.x, oldDiff.y) - largestAbsolute(newDiff.x, newDiff.y);
    if (this.onPinch) {
      this.onPinch({ x: oldDiff.x - newDiff.x, y: oldDiff.y - newDiff.y });
    }
  }

  _onTouchStart(e: Event) {
    const touchEvent = e as TouchEvent;
    this.oldTouches = [];
    this.touches = [...touchEvent.changedTouches];
    this.touchPositions = this.getTouchPositions(this.touches);
    this.multitouch = this.touches.length > 1;
    this.onStart(this.touchPositions[0]);
  }

  _onTouchEnd(e: Event) {
    this.removeTouches(e);
    this.touchPositions = [];
    this.onEnd();
  }

  _onTouchCancel(e: Event) {
    this.prevent(e);
    this.removeTouches(e);
    this.touchPositions = [];
  }

  _onTouchMove(e: Event) {
    this.prevent(e);
    const touchEvent = e as TouchEvent;
    this.oldTouches = this.touches;

    this.touches = [...touchEvent.changedTouches];
    // handle pinch
    this.multitouch = this.touches.length > 1;
    this.touchPositions = this.getTouchPositions(this.touches);
    if(this.multitouch) {
      this.handleMultitouch();
    }
    if (this.onTouch) {
      this.onTouch(this.touchPositions);
    }
  }

  _onWheel(e: Event) {
    const { deltaX, deltaY } = e as WheelEvent;
    if (this.onWheel) {
      this.onWheel({ x: deltaX, y: deltaY });
    }
  }
}

export default GestureHandler;
