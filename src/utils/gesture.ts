import { reactive } from "vue";
import { Vector2 } from "@/utils/layout.types";

type func = () => void;

type onTouchFunc = (touches: Vector2[]) => void;

type VectorArgFunc = (vec: Vector2, delta?: Vector2) => void;

type DefaultVector2 = { x: 0; y: 0 };

type onMoveFn = (vec: Vector2, delta: Vector2, fromWheel?: boolean) => void;

interface GestureHandlerOptions {
  onStart?: VectorArgFunc;
  onMove?: onMoveFn;
  onTouch?: onTouchFunc;
  onPinch?: VectorArgFunc;
  onWheel?: VectorArgFunc;
  onEnd?: func;
  target?: HTMLElement;
  preventDefault?: boolean;
}

class GestureHandler {
  onStart?: VectorArgFunc;
  onMove?: onMoveFn;
  onTouch?: onTouchFunc;
  onPinch?: VectorArgFunc;
  onWheel?: VectorArgFunc;
  onEnd?: func;
  target: (Window & typeof globalThis) | HTMLElement = window;
  preventDefault = true;

  private touches: Touch[] = [];
  private touchPositions: Vector2[] = [];
  private oldTouches: Touch[] = [];
  private mousePos = reactive<Vector2>({ x: 0, y: 0 });
  private pinching = false;
  private multitouch = false;
  public isTrackpad = false;

  constructor(options: GestureHandlerOptions) {
    if (options.target) {
      this.target = options.target;
    }
    if (options.preventDefault) {
      this.preventDefault = options.preventDefault;
    }
    if (options.onStart) {
      this.onStart = options.onStart;
    }
    if (options.onMove) {
      this.onMove = options.onMove;
    }
    if (options.onEnd) {
      this.onEnd = options.onEnd;
    }
    if (options.onTouch) {
      this.onTouch = options.onTouch;
    }
    if (options.onWheel) {
      this.onWheel = options.onWheel;
    }
    if (options.onPinch) {
      this.onPinch = options.onPinch;
    }

    this.init();
  }

  init() {
    this.target.addEventListener("mousedown", this._onMouseDown.bind(this));
    this.target.addEventListener("mouseup", this._onMouseUp.bind(this));
    this.target.addEventListener("mousemove", this._onMouseMove.bind(this));

    this.target.addEventListener("touchstart", this._onTouchStart.bind(this), {
      passive: false,
    });
    this.target.addEventListener("touchend", this._onTouchEnd.bind(this), {
      passive: false,
    });
    this.target.addEventListener(
      "touchcancel",
      this._onTouchCancel.bind(this),
      { passive: false }
    );
    this.target.addEventListener("touchleave", this._onTouchEnd.bind(this), {
      passive: false,
    });
    this.target.addEventListener("touchmove", this._onTouchMove.bind(this), {
      passive: false,
    });

    this.target.addEventListener("wheel", this._onWheel.bind(this), {
      passive: false,
    });
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
      e.stopPropagation();
    }
  }

  _onMouseDown(e: Event) {
    this.mousePos.x = (e as MouseEvent).clientX;
    this.mousePos.y = (e as MouseEvent).clientY;
    if (this.onStart) this.onStart(this.mousePos);
  }

  _onMouseUp() {
    if (this.onEnd) this.onEnd();
  }

  _onMouseMove(e: Event) {
    this.prevent(e);
    if (this.onMove) {
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
      this.handleMove();
    }
  }

  private handlePinch() {
    // calc diffs between touch positions
    if (this.onPinch) {
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
      this.onPinch({ x: oldDiff.x - newDiff.x, y: oldDiff.y - newDiff.y });
    }
  }

  private handleMove() {
    console.log(this.touches);
  }

  _onTouchStart(e: Event) {
    this.prevent(e);
    const touchEvent = e as TouchEvent;
    this.oldTouches = this.touches;
    console.log(touchEvent);
    this.touches = [...touchEvent.changedTouches];
    this.touchPositions = this.getTouchPositions(this.touches);
    this.multitouch = this.touches.length > 1;
    if (this.onStart) this.onStart(this.touchPositions[0]);

    if (this.onTouch) this.onTouch(this.touchPositions);
  }

  _onTouchEnd(e: Event) {
    this.prevent(e);
    if (this.onEnd) {
      this.removeTouches(e);
      this.touchPositions = [];
      this.touches = [];
      this.oldTouches = [];
      this.onEnd();
    }
  }

  _onTouchCancel(e: Event) {
    this.prevent(e);
    this.removeTouches(e);
    this.touchPositions = [];
    if (this.onTouch) this.onTouch(this.touchPositions);

    if (this.onEnd) this.onEnd();
  }

  _onTouchMove(e: Event) {
    const touchEvent = e as TouchEvent;
    this.oldTouches = this.touches;

    this.touches = [...touchEvent.changedTouches];
    // handle pinch
    this.multitouch = this.touches.length > 1;
    this.touchPositions = this.getTouchPositions(this.touches);
    if (this.multitouch) {
      this.prevent(e);
      e.preventDefault();
      this.handleMultitouch();
    }
    if (this.onTouch) {
      this.onTouch(this.touchPositions);
    }
  }

  _onWheel(e: Event) {
    this.detectTrackPad(e);
    const E = e as WheelEvent;
    const { deltaX, deltaY } = E;
    const deltaVec = { x: deltaX, y: deltaY };
    // change zoom
    e.preventDefault();
    if (this.isTrackpad) {
      // console.log(E.ctrlKey);
      if (E.ctrlKey && this.onWheel) {
        this.onWheel(deltaVec);
      } else if (this.onMove) {
        this.onMove(this.mousePos, { x: -deltaVec.x, y: -deltaVec.y }, true);
      }
    } else {
      if (this.onWheel) this.onWheel(deltaVec);
    }
  }

  detectTrackPad(e: any) {
    if (e.wheelDeltaY) {
      if (e.wheelDeltaY === e.deltaY * -3) {
        this.isTrackpad = true;
      }
    } else if (e.deltaMode === 0) {
      this.isTrackpad = true;
    } else {
      this.isTrackpad = false;
    }
  }
}

export default GestureHandler;
