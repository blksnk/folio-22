<script lang="ts" setup>
import { RouterView } from "vue-router";
import { onMounted, ref, reactive, onBeforeUnmount } from "vue";
import { debounce } from 'lodash'
import { Vector2, ScreenDims } from "@/utils/layout.types";
import { getScreenDims } from "@/utils/layout";
import { clamp, largestAbsolute, isBetween, getScaleCoef } from "./utils/math";
import GestureHandler from "./utils/gesture";

import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { useGestureData, velocity } from "@/stores/gestureData";

import NavBar from "./components/NavBar.vue";
import MouseCursor from "@/components/MouseCursor.vue";
import Loader from "./views/Loader.vue";
import Tutorial from "./views/Tutorial.vue";

let frameId = 0;

const mouseData = useMouseData();
const apiData = useApiData();
const gestureData = useGestureData();

// cursor handling

function translateCursor() {
  mouseData.mousePos.x +=
    (mouseData.targetMousePos.x - mouseData.mousePos.x) * 0.09;
  mouseData.mousePos.y +=
    (mouseData.targetMousePos.y - mouseData.mousePos.y) * 0.09;
}

// scroll handling
const SCROLL_MULTIPLIER = apiData.isMobile ? 1.5 : 1;

function updateScrollPos() {
  gestureData.scrollPos.x +=
    (gestureData.targetScrollPos.x - gestureData.scrollPos.x) * 0.09;
  gestureData.scrollPos.y +=
    (gestureData.targetScrollPos.y - gestureData.scrollPos.y) * 0.09;
}

// gesture vars

let gestures: GestureHandler | undefined;

// gesture handling

const onStart = (vec: Vector2) => {
  mouseData.targetMousePos.x = vec.x;
  mouseData.targetMousePos.y = vec.y;
  mouseData.mouseDown = true;
  if (!gestureData.translating && !apiData.isWindowOpen && !gestureData.dragDezooming) {
    setTimeout(() => {
      if (!gestureData.dragDezooming && mouseData.mouseDown) {
        gestureData.dragDezooming = true;
        gestureData.preTranslateZoomTarget = gestureData.zoomTarget;
        gestureData.zoomTarget = gestureData.preTranslateZoomTarget * 0.8;
      }
    }, 100);
  }
  mouseData.lastMousePos.x = vec.x;
  mouseData.lastMousePos.y = vec.y;
};

const onEnd = () => {
  gestureData.zoomTarget = gestureData.preTranslateZoomTarget;
  setTimeout(() => {
    gestureData.dragDezooming = false;
  }, 10);
  mouseData.mouseDown = false;
};

const onMove = (fromPointer: Vector2, delta: Vector2, fromTrackpad?: boolean) => {
  mouseData.targetMousePos.x = fromPointer.x;
  mouseData.targetMousePos.y = fromPointer.y;

  if (mouseData.mouseDown || fromTrackpad) {
    gestureData.translating = false;

    velocity.x = delta.x * (3 - gestureData.zoomFactor);
    if (!apiData.isWindowOpen) {
      velocity.y = delta.y * (3 - gestureData.zoomFactor);
    }
  }

  if (mouseData.mouseDown) {
    gestureData.setTargetScrollPos({ x: -delta.x * 1.5, y: -delta.y * 1.5 });
  }
};

const onTouch = (positions: Vector2[]) => {
  if (!mouseData.isTouch) {
    mouseData.isTouch = true;
  }
  if (positions.length === 1) {
    onMove(
      { x: 0, y: 0 },
      {
        x: positions[0].x - mouseData.lastMousePos.x,
        y: positions[0].y - mouseData.lastMousePos.y,
      }
    );
    const deltas = {
      x: (mouseData.targetMousePos.x - positions[0].x) * SCROLL_MULTIPLIER,
      y: (mouseData.targetMousePos.y - positions[0].y) * SCROLL_MULTIPLIER,
    };
    gestureData.setTargetScrollPos(deltas);
    mouseData.targetMousePos.x = positions[0].x;
    mouseData.targetMousePos.y = positions[0].y;
    mouseData.lastMousePos.x = positions[0].x;
    mouseData.lastMousePos.y = positions[0].y;
  }
};

const onWheel_Native = ({ x, y }: Vector2) => {
  gestureData.setTargetScrollPos({ x, y });
};

function onWheel({ x, y }: Vector2) {
  const target = clamp(gestureData.zoomTarget - largestAbsolute(x, y) / 350, 0.2, 2.5);
  gestureData.zoomTarget = target
}

// resize event handler

const onResize = debounce(() => {
  gestureData.screenSize = getScreenDims();
  apiData.isMobile = gestureData.screenSize.x < 600;
  apiData.baseWindowSize = {
    x: gestureData.screenSize.x < 600 ? 250 : 500,
    y: gestureData.screenSize.y < 600 ? 250 : 500,
  };
}, 500);

// window handling

const minMoveFactor = 0.55

function decreaseVelocity() {
  const f = gestureData.translating ? gestureData.DRAG_FACTOR : 0;
  velocity.x *= gestureData.DRAG_FACTOR;
  velocity.y *= gestureData.DRAG_FACTOR;
  if (
    Math.abs(velocity.x) < 0.000001
  ) {
    velocity.x = 0;
  }
  if (
    Math.abs(velocity.y) < 0.000001
  ) {
    velocity.y = 0;
  }
}

function getOffsetFromCenterCoef(value: number, vectorName: "x" | "y"): number {
  return Math.max(
    Math.abs(gestureData.screenSize.center[vectorName] - value) / gestureData.screenSize[vectorName] +
    minMoveFactor,
    0
  );
}

  function tranformWindowsOnDrag(): void {
    const zoom = gestureData.zoomFactor;
    const zoomInvert = 1 - zoom;

    apiData.allWindows.forEach((window) => {
      const { x, y } = window.transform;

      const offsetFromCenter: Vector2 = {
        x: getOffsetFromCenterCoef(x, "x"),
        y: getOffsetFromCenterCoef(y, "y"),
      };
      const scale = getScaleCoef(offsetFromCenter);
      // select window if centered
      if (
        isBetween(offsetFromCenter.x, 0.5, 0.6) &&
        isBetween(offsetFromCenter.y, 0.5, 0.6) &&
        !gestureData.translating &&
        !window.hidden &&
        // !isMediaWindow(window.id)
        apiData.selectedId !== window.id
      ) {
        apiData.setWindowSelection(window.id);
      }
      window.transformPreZoom.x += velocity.x * (2 - zoom); // * offsetFromCenter.x;
      window.transformPreZoom.y += velocity.y * (2 - zoom); //* offsetFromCenter.y;
      window.targetTransform.x =
        window.transformPreZoom.x * zoom + gestureData.screenSize.center.x * zoomInvert;
      window.targetTransform.y =
        window.transformPreZoom.y * zoom + gestureData.screenSize.center.y * zoomInvert;
      window.targetTransform.scale = scale * zoom;
    });
  }

function translateToTargetPos() {
  if (apiData.selectedWindow && gestureData.translating) {
    const { x, y } = apiData.selectedWindow.transform;
    const dstToTarget = {
      x: gestureData.screenSize.center.x - x,
      y: gestureData.screenSize.center.y + 24 - y,
    };

    const needsTranslate =
      Math.max(Math.abs(dstToTarget.x), Math.abs(dstToTarget.y)) > 1;

    if (needsTranslate) {
      velocity.x += dstToTarget.x * 0.005;
      velocity.y += (dstToTarget.y * 0.005) / gestureData.screenSize.ratio;
    } else if (gestureData.translating) {
      console.log('reset translating', apiData.selectedId)
      gestureData.translating = false;
      apiData.setWindowSelection(apiData.selectedId);
    }
  }
}

  // main animation loop. runs every frame.

  const animateLoop = () => {
    translateCursor();

    gestureData.applyZoom()
    translateToTargetPos()
    tranformWindowsOnDrag()
    updateScrollPos();
    decreaseVelocity();

    frameId = requestAnimationFrame(animateLoop);
  };

  onMounted(() => {
    apiData.load(apiData.baseWindowSize);

    gestures = new GestureHandler({
      onStart,
      onEnd,
      onMove,
      onTouch,
      onWheel,
      onWheel_Native,
      onPinch: onWheel,
      preventDefault: true,
    });

    window.addEventListener("resize", onResize);
    // window.addEventListener("wheel", onWheel);

    frameId = requestAnimationFrame(animateLoop);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    // window.removeEventListener("wheel", onWheel);
    cancelAnimationFrame(frameId);
    if (gestures) {
      gestures.destroy();
    }
  });
</script>

<template>
  <router-view v-if="apiData.loaded && apiData.imgsPreloaded"> </router-view>
  <transition name="fade">
    <Tutorial v-if="apiData.showTutorial"/>
  </transition>
  <Loader v-if="apiData.showLoader"/>
  <NavBar />
  <MouseCursor v-if="!apiData.isMobile" />
</template>

<style lang="sass">

.slide-enter-active, .slide-leave-active
  transition: transform 1s linear

.slide-enter-from, .slide-leave-to
  transform: translateX(100vw) !important
</style>
