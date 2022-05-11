<script lang="ts" setup>
// import { RouterView } from "vue-router";
import { onMounted, ref, reactive, onBeforeUnmount } from "vue";
// import { useApiData } from "@/stores/apiData";
// import { loadApi } from "./utils/api";
import { Vector2, ScreenDims } from "@/utils/layout.types";
import { getScreenDims } from "@/utils/layout";
import GestureHandler from "./utils/gesture";

import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { useGestureData } from "@/stores/gestureData";

import NavBar from "./components/NavBar.vue";
import MouseCursor from "@/components/MouseCursor.vue";
import Loader from "./views/Loader.vue";

let frameId = 0;

const mouseData = useMouseData();
const apiData = useApiData();
const gestureData = useGestureData();

// cursor vars

const mousePos = reactive<Vector2>({ x: 0, y: 0 });
const targetMousePos = reactive<Vector2>({ x: 0, y: 0 });
const mouseDown = ref<boolean>(false);

const SCROLL_MULTIPLIER = apiData.isMobile ? 1.5 : 1;
// cursor handling

function translateCursor() {
  mouseData.mousePos.x +=
    (mouseData.targetMousePos.x - mouseData.mousePos.x) * 0.09;
  mouseData.mousePos.y +=
    (mouseData.targetMousePos.y - mouseData.mousePos.y) * 0.09;
}

// scroll handling
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
};

const onEnd = () => {
  mouseData.mouseDown = false;
};

const onMove = (vec: Vector2, delta: Vector2) => {
  mouseData.targetMousePos.x = vec.x;
  mouseData.targetMousePos.y = vec.y;

  if (mouseData.mousDown) {
    gestureData.setTargetScrollPos(delta);
  }
};

const onTouch = (positions: Vector2[]) => {
  // if (!mouseDown.value && positions.length > 1) {
  //   mouseDown.value = true;
  // } else if (mouseDown.value) {
  //   mouseDown.value = false;
  // }
  if (!mouseData.isTouch) {
    mouseData.isTouch = true;
  }
  if (positions.length === 1) {
    const deltas = {
      x: (mouseData.targetMousePos.x - positions[0].x) * SCROLL_MULTIPLIER,
      y: (mouseData.targetMousePos.y - positions[0].y) * SCROLL_MULTIPLIER,
    };
    gestureData.setTargetScrollPos(deltas);
    mouseData.targetMousePos.x = positions[0].x;
    mouseData.targetMousePos.y = positions[0].y;
  }
};

const onWheel = ({ deltaX, deltaY }: WheelEvent) => {
  gestureData.setTargetScrollPos({ x: deltaX, y: deltaY });
};

// resize event handler

const onResize = () => {
  const { x, y } = getScreenDims();
  apiData.isMobile = x < 600;
  apiData.baseWindowSize = {
    x: x < 600 ? 250 : 500,
    y: y < 600 ? 250 : 500,
  };
};

const onMouseDown = () => {
  if (mouseData.isTouch) {
    console.log('runs')
    // mouseData.isTouch = false;
  }
};

// main animation loop. runs every frame.

const animateLoop = () => {
  translateCursor();
  updateScrollPos();
  frameId = requestAnimationFrame(animateLoop);
};

onMounted(() => {
  apiData.load(apiData.baseWindowSize);

  gestures = new GestureHandler({
    onStart,
    onEnd,
    onMove,
    onTouch,
    preventDefault: true,
  });

  window.addEventListener("resize", onResize);
  window.addEventListener("wheel", onWheel);
  window.addEventListener("mousedown", onMouseDown);

  animateLoop();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("mousedown", onMouseDown);
  cancelAnimationFrame(frameId);
  if (gestures) {
    gestures.destroy();
  }
});
</script>

<template>
  <router-view v-if="apiData.loaded && apiData.imgsPreloaded"> </router-view>
  <NavBar />
  <Loader/>
  <MouseCursor v-if="!apiData.isMobile" />
</template>

<style lang="sass">

.slide-enter-active, .slide-leave-active
  transition: transform 1s linear

.slide-enter-from, .slide-leave-to
  transform: translateX(100vw) !important
</style>
