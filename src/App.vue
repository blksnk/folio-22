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
import AppLogo from "./components/icons/AppLogo.vue";
import MouseCursor from "@/components/MouseCursor.vue";

let frameId = 0

const mouseData = useMouseData()
const apiData = useApiData()
const gestureData = useGestureData()

const isMobile = ref<boolean>(window.innerWidth < 600);


// cursor vars

const mousePos = reactive<Vector2>({ x: 0, y: 0 });
const targetMousePos = reactive<Vector2>({ x: 0, y: 0 });
const mouseDown = ref<boolean>(false);
const showCursor = ref(false);
const cursorText = ref("Select");
const cursorIcon = ref<string | undefined>("eye-outline");

// cursor handling

function translateCursor() {
  mousePos.x += (targetMousePos.x - mousePos.x) * 0.09;
  mousePos.y += (targetMousePos.y - mousePos.y) * 0.09;
  mouseData.setMousePos(mousePos)
}

// scroll handling
function updateScrollPos() {
  gestureData.scrollPos.x += (gestureData.targetScrollPos.x - gestureData.scrollPos.x) * 0.09;
  gestureData.scrollPos.y += (gestureData.targetScrollPos.y - gestureData.scrollPos.y) * 0.09;
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
  mouseData.mouseDown = true;
};

const onEnd = () => {
  mouseDown.value = false;
  onEndVal.value = !onEndVal.value;
};

const onMove = (vec: Vector2, delta: Vector2) => {
  targetMousePos.x = vec.x;
  targetMousePos.y = vec.y;
  onMoveVector2.value = vec;
};

const onTouch = (positions: Vector2[]) => {
  if (!mouseDown.value && positions.length > 1) {
    mouseDown.value = true;
  } else if (mouseDown.value) {
    mouseDown.value = false;
  }
  onTouchPositions.value = positions;
};

const onWheel = ({deltaX, deltaY}: WheelEvent) => {
  gestureData.setTargetScrollPos({x: deltaX, y: deltaY})
};

const onPinch = (vec: Vector2) => {
  onPinchVector2.value = vec;
};

// resize event handler

const onResize = () => {
  const { x, y } = getScreenDims();
  apiData.isMobile = x < 600;
  apiData.baseWindowSize = {
      x: x < 600 ? 250 : 500,
      y: y < 600 ? 250 : 500,
  }
};

// main animation loop. runs every frame.

const animateLoop = () => {
  translateCursor();
  updateScrollPos();
  frameId = requestAnimationFrame(animateLoop);
};

onMounted(() => {
  apiData.load(apiData.baseWindowSize)

  gestures = new GestureHandler({
    onStart,
    onEnd,
    onMove,
    onTouch,
    onPinch,
    preventDefault: true,
  });

  window.addEventListener("resize", onResize);
  window.addEventListener("wheel", onWheel)

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
  <router-view v-if="apiData.loaded">
  </router-view>
  <NavBar />
  <AppLogo />
  <MouseCursor v-if="!apiData.isMobile" />
</template>

<style lang="sass">

.slide-enter-active, .slide-leave-active
  transition: transform 1s linear

.slide-enter-from, .slide-leave-to
  transform: translateX(100vw) !important
</style>
