<template>
  <FixedFrame
    class="dotted"
    @close="onClose()"
    :displayTitle="windowOpen"
    :title="openWindow?.title"
  >
    <Window
      v-for="window in windows"
      :key="window.id"
      :title="window.title"
      :transform="window.transform"
      :id="window.id"
      :selected="window.selected"
      :thumbnail="window.thumbnail"
      :open="window.open"
      :velocity="{ x: Math.round(velocity.x), y: Math.round(velocity.y) }"
      :zoomFactor="zoomFactor.value"
      :hidden="window.hidden"
      :baseSize="baseWindowSize"
      :screenSize="screenSize"
      @mouseup="() => selectWindow(window.id, false)"
      @mouseover="onMouseOver(window.id)"
      @mouseleave="onMouseLeave()"
      @open="onOpen(window.id)"
    />
    <Minimap
      :items="minimapItems"
      :screenSize="screenSize"
      :onSelect="selectWindow"
      :zoomFactor="zoomFactor"
    />
    <!-- <TextWindow content="test content" title="text title" :zoomFactor="zoomFactor.value" id="0" /> -->
  </FixedFrame>
  <MouseCursor v-if="!isMobile" :mousePos="mousePos" :showText="showCursor" />
  <!-- <Debug :lines="debugLine" title="Debug" /> -->
</template>

<script lang="ts">
export const getScreenDims = () => ({
  x: window.innerWidth,
  y: window.innerHeight,
  center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  ratio: window.innerWidth / window.innerHeight,
});
</script>

<script setup lang="ts">
import {
  reactive,
  onBeforeUnmount,
  onMounted,
  computed,
  ref,
  watchEffect,
} from "vue";
// import { storeToRefs } from "pinia";

import FixedFrame from "@/components/FixedFrame.vue";
import Window, { Transform } from "@/components/Window.vue";
import Minimap from "@/components/Minimap.vue";
// import Debug from "@/components/Debug.vue";

// import { useApiData } from "@/stores/apiData";
import GestureHandler from "@/utils/gesture";
import { Vector2, isWindowVisible } from "@/utils/layout";
import { loadApi } from "@/utils/api";
import MouseCursor from "@/components/MouseCursor.vue";
import { ImageFormat } from "@/utils/api.types";

export interface ScreenDims extends Vector2 {
  center: Vector2;
  ratio: number;
}

interface WindowData {
  transform: Transform;
  targetTransform: Transform;
  title: string;
  id: number | string;
  selected: boolean;
  thumbnail: ImageFormat;
  initialPosition: Vector2;
  transformPreZoom: Vector2;
  open: boolean;
  hidden: boolean;
}

interface CanvasBoundaries {
  min: Vector2;
  max: Vector2;
}

let screenSize = reactive<ScreenDims>(getScreenDims());

const isMobile = ref<boolean>(screenSize.x < 600);

const baseWindowSize = reactive<Vector2>({
  x: isMobile.value ? 250 : 500,
  y: isMobile.value ? 250 : 500,
});


const marginBetweenWindows = baseWindowSize.x / 4;

let mouseDown = false;
let lastMousePos: Vector2 = { x: 0, y: 0 };
let mousePos = reactive<Vector2>({ x: 0, y: 0 });
let targetMousePos = reactive<Vector2>({ x: 0, y: 0 });
let showCursor = ref(false);

let velocity = reactive<Vector2>({ x: 0, y: 0 });

let minMoveFactor = 0.5;
let dragFactor = 0.9;
let frameId = 0;
let translating = reactive({ value: false });
let selectedId = reactive<{ id: string | number }>({ id: 0 });
let gestures: GestureHandler | undefined;
let zoomFactor = reactive({ value: 0.15 });
let preTranslateZoomTarget = 0.5;
let zoomTarget = 0.5;
let dragDezooming = false;
const clickDuration = 100;

let debugLine = reactive<Vector2>({ x: 0, y: 0 });
let windows = ref<WindowData[]>([]);
const initialBoundaries = reactive<CanvasBoundaries>({
  min: { x: 0, y: 0 },
  max: { x: 0, y: 0 },
});

const windowOpen = computed(() =>
  windows.value.some((el: WindowData) => el.open)
);

const openWindow = computed(() =>
  windows.value.find((el: WindowData) => el.open)
);

// takes zoom into account
const effectiveBoundaries = computed(() => {
  const zoomComp = 3 - zoomFactor.value;
  return {
    min: {
      x: -initialBoundaries.min.x * zoomComp,
      y: -initialBoundaries.min.y * zoomComp,
    },
    max: {
      x: -initialBoundaries.max.x * zoomComp,
      y: -initialBoundaries.max.y * zoomComp,
    },
  };
});

const initPositionVariation: Vector2 = {
  x: screenSize.x < 600 ? 50 : 300,
  y: screenSize.x < 600 ? 200 : 500,
};

const translatePosition = reactive<Vector2>({ x: screenSize.center.x, y: 0 });

const selectedWindow = computed(() =>
  windows.value.find((el) => el.id === selectedId.id)
);

function getOffsetFromCenterCoef(value: number, vectorName: "x" | "y"): number {
  return Math.max(
    Math.abs(screenSize.center[vectorName] - value) / screenSize[vectorName] +
    minMoveFactor,
    0
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function isBetween(v: number, min: number, max: number): boolean {
  return v > min && v < max;
}

function largestAbsolute(n1: number, n2: number): number {
  return Math.abs(n1) > Math.abs(n2) ? n1 : n2;
}

function getScaleCoef(offset: Vector2): number {
  const sum = offset.x + offset.y;
  const scaleCoef = clamp((1 - sum / 2 + 0.5) * 1.3, 0.5, 1);
  return scaleCoef;
}

function tranformWindowsOnDrag(vel: Vector2): void {
  const zoom = zoomFactor.value;
  const zoomInvert = 1 - zoom;
  translatePosition.x += vel.x * (2 - zoom);
  translatePosition.y += vel.y * (2 - zoom);

  windows.value.forEach((window, index) => {
    const { x, y } = window.transform;

    const offsetFromCenter: Vector2 = {
      x: getOffsetFromCenterCoef(x, "x"),
      y: getOffsetFromCenterCoef(y, "y"),
    };
    const scale = getScaleCoef(offsetFromCenter);
    // select window if centered
    if (
      isBetween(offsetFromCenter.x, 0.5, 0.575) &&
      isBetween(offsetFromCenter.y, 0.5, 0.7) &&
      !translating.value
    ) {
      setWindowSelection(window.id);
    }
    window.transformPreZoom.x += vel.x * (2 - zoom); // * offsetFromCenter.x;
    window.transformPreZoom.y += vel.y * (2 - zoom); //* offsetFromCenter.y;
    window.targetTransform.x =
      window.transformPreZoom.x * zoom + screenSize.center.x * zoomInvert;
    window.targetTransform.y =
      window.transformPreZoom.y * zoom + screenSize.center.y * zoomInvert;
    window.targetTransform.scale = scale * zoom;
  });
}

function applyWindowTransforms() {
  windows.value.forEach((window) => {
    window.transform.x +=
      (window.targetTransform.x - window.transform.x) / dragFactor;
    window.transform.y +=
      (window.targetTransform.y - window.transform.y) / dragFactor;
  });
}

function onStart({ x, y }: Vector2): void {
  // wait for a click on window. if no click, toggle zoom animation on move
  if (!windowOpen.value) {
    if (!translating.value && !windowOpen.value && !dragDezooming) {
      setTimeout(() => {
        if (!dragDezooming && mouseDown) {
          dragDezooming = true;
          preTranslateZoomTarget = zoomTarget;
          zoomTarget = preTranslateZoomTarget * 0.8;
        }
      }, clickDuration);
    }
    lastMousePos.x = x;
    lastMousePos.y = y;
    mouseDown = true;
  }
}

function onEnd(): void {

  zoomTarget = preTranslateZoomTarget;
  setTimeout(() => {
    dragDezooming = false
  }, )
  mouseDown = false;
}

function keepInBounds() {
  const bounds = effectiveBoundaries.value;
  let diffX = 0;
  let diffY = 0;
  if (translatePosition.x > bounds.min.x) {
    diffX = -10;
  }
  if (translatePosition.x < bounds.max.x) {
    diffX = 10;
  }
  if (translatePosition.y > bounds.min.y) {
    diffY = -10;
  }
  if (translatePosition.y < bounds.max.y) {
    diffY = 10;
  }
  if (diffX || diffY) {
    console.log("BOUNDARY BREAK");
    if (screenSize.x < 600) {
      diffX *= 0.75;
      diffY *= 0.5;
    }
    mouseDown = false;
    velocity.x += diffX;
    velocity.y += diffY;
  }
}

function onMove({ x, y }: Vector2): void {
  targetMousePos.x = x;
  targetMousePos.y = y;
  if (mouseDown) {
    zoomTarget = zoomFactor.value;
    translating.value = false;
    const deltaX: number = x - lastMousePos.x;
    const deltaY: number = y - lastMousePos.y;

    velocity.x = deltaX * (2 - zoomFactor.value);
    velocity.y = deltaY * (2 - zoomFactor.value);
  }
  lastMousePos.x = x;
  lastMousePos.y = y;
}

function onTouch(touchPositions: Vector2[]): void {
  if (touchPositions.length === 1) {
    onMove(touchPositions[0]);
  }
}

function decreaseVelocity(dragFactor = 0.0) {
  velocity.x *= dragFactor;
  velocity.y *= dragFactor;
}

function setWindowSelection(selectId: number | string) {
  selectedId.id = selectId;
  windows.value.forEach((window) => {
    window.selected = window.id === selectId;
  });
}

function onOpen(windowId: number | string) {
  setWindowSelection(windowId);
  console.log("open", windowId);
  zoomTarget = 0.9;
  translating.value = true;

  windows.value.forEach((window) => {
    const openWindow = window.id === windowId;
    window.open = window.id === windowId;
    // hide other windows
    if (!openWindow) {
      window.hidden = true;
      // hideWindowIfNeeded(window);
    }
  });
}

function onClose() {
  windows.value.forEach((window: WindowData) => {
    window.open = false;
    window.hidden = false;
  });
}

function getWindowById(windowId: number | string) {
  return windows.value.find(({ id }) => id === windowId);
}

const selectWindow = (
  targetId: number | string,
  forceShowCursor = false,
  event?: MouseEvent
) => {
  const window = getWindowById(targetId);
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (window && selectedId.id !== targetId) {
    selectedId.id = targetId;
    translating.value = true;
    showCursor.value = forceShowCursor; // default to hiding cursor on click
    setWindowSelection(targetId);
    zoomTarget = 0.8;
    preTranslateZoomTarget = 0.8;
  }
};

function translateToTargetPos() {
  if (selectedWindow?.value && translating.value) {
    const { x, y } = selectedWindow.value.transform;
    const dstToTarget = {
      x: screenSize.center.x - x,
      y: screenSize.center.y - y,
    };

    const needsTranslate =
      Math.max(Math.abs(dstToTarget.x), Math.abs(dstToTarget.y)) > 0.1;

    if (needsTranslate) {
      velocity.x += dstToTarget.x * 0.005;
      velocity.y += (dstToTarget.y * 0.005) / screenSize.ratio;
    } else if (translating.value) {
      translating.value = false;
    }
  }
}

function onWheel({ x, y }: Vector2) {
  zoomTarget = clamp(zoomTarget - largestAbsolute(x, y) / 500, 0.2, 1.6);
  debugLine.x = x;
  debugLine.y = y;
}

function onPinch({ x, y }: Vector2) {
  zoomTarget = clamp(zoomTarget - largestAbsolute(x, y) / 2, 0.2, 1.6);
  debugLine.x = x;
  debugLine.y = y;
}

function applyZoom() {
  zoomFactor.value += (zoomTarget - zoomFactor.value) * 0.05;
}

function translateCursor() {
  mousePos.x += (targetMousePos.x - mousePos.x) * 0.15;
  mousePos.y += (targetMousePos.y - mousePos.y) * 0.15;
}

function onMouseOver(windowId: number | string) {
  if (selectedId.id !== windowId) {
    showCursor.value = true;
  }
}

function onMouseLeave() {
  if (showCursor.value) {
    showCursor.value = false;
  }
}

function animate(): void {
  frameId = requestAnimationFrame(animate);
  applyZoom();
  tranformWindowsOnDrag(velocity);
  translateToTargetPos();
  translateCursor();
  keepInBounds();
  decreaseVelocity(translating ? dragFactor : 0);
}

function randomOffset(n: number) {
  return Math.random() * n * 2 - Math.random() * n;
}

const minimapItems = computed(() =>
  windows.value.map(({ transform, thumbnail, selected, id, hidden }) => ({
    transform: {
      x: transform.x,
      y: transform.y,
    },
    ratio: thumbnail.aspectRatio,
    selected,
    height: thumbnail.height,
    width: thumbnail.width,
    hidden,
    id,
  }))
);

function getBoundaries(
  windows: WindowData[],
  buffer: Vector2 = screenSize.center
) {
  const { max, min } = windows.reduce(
    (acc, { initialPosition }) => {
      return {
        max: {
          x: initialPosition.x > acc.max.x ? initialPosition.x : acc.max.x,
          y: initialPosition.y > acc.max.y ? initialPosition.y : acc.max.y,
        },
        min: {
          x: initialPosition.x < acc.min.x ? initialPosition.x : acc.min.x,
          y: initialPosition.y < acc.min.y ? initialPosition.y : acc.min.y,
        },
      };
    },
    { ...initialBoundaries }
  );
  return {
    max: {
      x: max.x + initPositionVariation.x,
      y: max.y + initPositionVariation.y,
    },
    min: {
      x: min.x - buffer.x,
      y: min.y - initPositionVariation.y,
    },
  };
}

function setInitalBoundaries() {
  const { max, min } = getBoundaries(windows.value, {
    x: screenSize.center.x,
    y: screenSize.center.y,
  });
  initialBoundaries.min = min;
  initialBoundaries.max = max;
  console.log(initialBoundaries);
}

function initialWindowPosition(index: number, prevRatio: number, currentRatio: number): Vector2 {
  const x =
    (index % 2 === 0 ? index : index - 1) *
    (baseWindowSize.x / 2 + marginBetweenWindows);
  const y =
    index % 2 === 0 ? 0 : (baseWindowSize.x / prevRatio / currentRatio) + marginBetweenWindows;
  return { x, y };
}

onMounted(async () => {
  const apiRes = await loadApi();

  console.log(apiRes)

  if (apiRes && apiRes?.projects) {
    windows.value = apiRes.projects.map((project, index) => {
      const initPos = initialWindowPosition(
        index,
        index > 0
          ? apiRes.projects[index - 1].thumbnail.original.aspectRatio
          : 0,
        project.thumbnail.original.aspectRatio
      );
      const transform = {
        ...initPos,
        scale: 1,
      };

      return {
        transform,
        targetTransform: transform,
        initialPosition: initPos,
        transformPreZoom: initPos,
        title: project.title,
        id: project.uid,
        selected: index === 0,
        thumbnail: project.thumbnail.large,
        open: false,
        hidden: false,
      };
    });
  }
  setInitalBoundaries();
  animate();

  gestures = new GestureHandler({
    onStart,
    onEnd,
    onMove,
    onTouch,
    onWheel,
    onPinch,
  });

  window.addEventListener("resize", () => {
    baseWindowSize.x = isMobile.value ? 250 : 500;
    baseWindowSize.y = isMobile.value ? 250 : 500;
    const { x, y, center, ratio } = getScreenDims();
    screenSize.x = x;
    isMobile.value = x < 600;
    screenSize.y = y;
    screenSize.center = center;
    screenSize.ratio = ratio;
    setInitalBoundaries();
  });
});

onBeforeUnmount(() => {
  console.log("cancel frame", frameId);
  cancelAnimationFrame(frameId);
  if (gestures) {
    gestures.destroy();
  }
});

window.addEventListener("resize", () => {
  console.log("resize");
});
</script>

<style lang="sass">
.dotted
  background-image: radial-gradient($c-grey-2 1px, transparent 0)
  background-size: 24px 24px
  background-position: center center
</style>
