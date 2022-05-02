<script lang="ts" setup>
// import { RouterView } from "vue-router";
import { onMounted, ref, reactive, onBeforeUnmount } from "vue";
// import { useApiData } from "@/stores/apiData";
// import { loadApi } from "./utils/api";
import { Vector2, ScreenDims } from "@/utils/layout.types";
import { createAllProjectsMediaWindows, createProjectWindows, getScreenDims } from "@/utils/layout";
import GestureHandler from "./utils/gesture";

import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { useGestureData } from "@/stores/gestureData";

import NavBar from "./components/NavBar.vue";
import AppLogo from "./components/icons/AppLogo.vue";
import MouseCursor from "@/components/MouseCursor.vue";

let frameId = 0

const mouseData = useMouseData()
const apiData = useApiData()
const gestureData = useGestureData()

const isMobile = ref<boolean>(window.innerWidth < 600);
const baseWindowSize = reactive<Vector2>({
  x: isMobile.value ? 250 : 500,
  y: isMobile.value ? 250 : 500,
});

// cursor vars

const mousePos = reactive<Vector2>({ x: 0, y: 0 });
const targetMousePos = reactive<Vector2>({ x: 0, y: 0 });
const mouseDown = ref<boolean>(false);
const showCursor = ref(false);
const cursorText = ref("Select");
const cursorIcon = ref<string | undefined>("eye-outline");

// cursor handling

function translateCursor() {
  mousePos.x += (targetMousePos.x - mousePos.x) * 0.15;
  mousePos.y += (targetMousePos.y - mousePos.y) * 0.15;
  mouseData.setMousePos(mousePos)
}

// scroll handling
function updateScrollPos() {
  gestureData.scrollPos.x += (gestureData.targetScrollPos.x - gestureData.scrollPos.x) * 0.15;
  gestureData.scrollPos.y += (gestureData.targetScrollPos.y - gestureData.scrollPos.y) * 0.15;
}

// gesture vars

let gestures: GestureHandler | undefined;

const onStartVector2 = reactive<Vector2>({ x: 0, y: 0 });
const onMoveVector2 = ref<Vector2>({ x: 0, y: 0 });
const onWheelVector2 = ref<Vector2>({ x: 0, y: 0 });
const onPinchVector2 = ref<Vector2>({ x: 0, y: 0 });
const onTouchPositions = ref<Vector2[]>([]);
const onEndVal = ref<boolean>(false);

// gesture handling

const onStart = (vec: Vector2) => {
  onStartVector2.x = vec.x;
  onStartVector2.y = vec.y;
  mouseDown.value = true;
};

const onEnd = () => {
  mouseDown.value = false;
  onEndVal.value = !onEndVal.value;
};

const onMove = (vec: Vector2, delta: Vector2) => {
  targetMousePos.x = vec.x;
  targetMousePos.y = vec.y;
  onMoveVector2.value = vec;
  gestureData.targetScrollPos.x += delta.x
  gestureData.targetScrollPos.y += delta.y
};

const onTouch = (positions: Vector2[]) => {
  if (!mouseDown.value && positions.length > 1) {
    mouseDown.value = true;
  } else if (mouseDown.value) {
    mouseDown.value = false;
  }
  onTouchPositions.value = positions;
};

const onWheel = (vec: Vector2) => {
  onWheelVector2.value = vec;
};

const onPinch = (vec: Vector2) => {
  onPinchVector2.value = vec;
};

// resize event handler

const onResize = () => {
  const { x } = getScreenDims();
  isMobile.value = x < 600;
};

// main animation loop. runs every frame.

const animateLoop = () => {
  translateCursor();
  updateScrollPos();
  frameId = requestAnimationFrame(animateLoop);
};

// update listeners

const updateShowCursor = (v: boolean) => {
  showCursor.value = v;
};
const updateCursorText = (v: string) => {
  cursorText.value = v;
};
const updateCursorIcon = (v: string | undefined) => {
  cursorIcon.value = v;
};

onMounted(() => {
  apiData.load(baseWindowSize)

  gestures = new GestureHandler({
    onStart,
    onEnd,
    onMove,
    onTouch,
    onWheel,
    onPinch,
    preventDefault: true,
  });

  window.addEventListener("resize", onResize);

  animateLoop();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (gestures) {
    gestures.destroy();
  }
});
</script>

<template>
  <router-view v-if="apiData.loaded" v-bind="{
    isMobile,
  }" @update:showCursor="updateShowCursor" @update:cursorText="updateCursorText"
    @update:cursorIcon="updateCursorIcon">
  </router-view>
  <NavBar />
  <AppLogo />
  <MouseCursor v-if="!isMobile" :mousePos="mousePos" :showText="showCursor" :text="cursorText" :icon="cursorIcon" />
</template>

<style lang="sass">

.slide-enter-active, .slide-leave-active
  transition: transform 1s linear

.slide-enter-from, .slide-leave-to
  transform: translateX(100vw) !important
</style>
