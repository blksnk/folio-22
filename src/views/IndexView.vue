<template>
  <FixedFrame
    class="dotted"
    @close="() => onClose(openWindow?.id)"
    :displayTitle="isWindowOpen"
    :title="openWindow?.title"
  >
    <Window
      v-for="window in allWindows"
      :key="window.id"
      :title="window.title"
      :transform="window.transform"
      :id="window.id"
      :selected="window.selected"
      :thumbnail="window.thumbnail"
      :open="window.open || isMediaWindow(window.id)"
      :velocity="velocity"
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
  watch,
  watchEffect,
} from "vue";
import { debounce } from "lodash";
// import { storeToRefs } from "pinia";

import FixedFrame from "@/components/FixedFrame.vue";
import Window from "@/components/Window.vue";
import Minimap from "@/components/Minimap.vue";
import MouseCursor from "@/components/MouseCursor.vue";
import SelectedProjectWindows from "@/components/SelectedProjectWindows.vue";
// import Debug from "@/components/Debug.vue";

// import { useApiData } from "@/stores/apiData";
import GestureHandler from "@/utils/gesture";
import {
  createBoundaries,
  keepInBoundaries,
  createProjectWindows,
  createMediaWindows,
  createAllProjectsMediaWindows,
  isMediaWindow,
} from "@/utils/layout";
import {
  WindowData,
  ScreenDims,
  Boundary,
  Vector2,
  ProjectMediaWindows,
  Transform,
} from "@/utils/layout.types";
import { loadApi } from "@/utils/api";
import { clamp, getScaleCoef, largestAbsolute, isBetween } from "@/utils/math";
import { Project, uid } from "@/utils/api.types";

let screenSize = reactive<ScreenDims>(getScreenDims());

const isMobile = ref<boolean>(screenSize.x < 600);

const baseWindowSize = reactive<Vector2>({
  x: isMobile.value ? 250 : 500,
  y: isMobile.value ? 250 : 500,
});

let mouseDown = false;
let lastMousePos: Vector2 = { x: 0, y: 0 };
let mousePos = reactive<Vector2>({ x: 0, y: 0 });
let targetMousePos = reactive<Vector2>({ x: 0, y: 0 });
let showCursor = ref(false);

let velocity = reactive<Vector2>({ x: 0, y: 0 });

let minMoveFactor = 0.55;
let dragFactor = 0.9;
let frameId = 0;
let translating = reactive({ value: false });
let selectedId = reactive<{ id: string | number }>({ id: 0 });
let gestures: GestureHandler | undefined;
let zoomFactor = reactive({ value: 0.15 });
let preTranslateZoomTarget = isMobile.value ? 0.8 : 0.5;
let zoomTarget = isMobile.value ? 0.8 : 0.6;
let dragDezooming = false;

let debugLine = reactive<Vector2>({ x: 0, y: 0 });
let windows = ref<WindowData[]>([]);
let PROJECTS = ref<Project[]>([]);
const initialBoundaries = reactive<Boundary>({
  top: -10000,
  bottom: 10000,
  left: -10000,
  right: 10000,
});
const projectMediaWindows = ref<ProjectMediaWindows[]>([]);
// const selectedProjectMediaWindows = computed<WindowData[]>(
//   () => projectMediaWindows.value[selectedWindow.value?.id || "NO_OPEN"] || []
// );

const isWindowOpen = computed<boolean>(() =>
  windows.value.some((el: WindowData) => el.open)
);

const openWindow = computed<WindowData | undefined>(() =>
  windows.value.find((el: WindowData) => el.open)
);
const allWindows = ref<WindowData[]>([]);

const selectedWindow = computed<WindowData | undefined>(() =>
  allWindows.value.find((el) => el.id === selectedId.id)
);


// takes zoom into account
const effectiveBoundaries = computed(() => {
  // const zoomComp = 3 - zoomFactor.value;
  // return {
  //   min: {
  //     x: -initialBoundaries.min.x * zoomComp,
  //     y: -initialBoundaries.min.y * zoomComp,
  //   },
  //   max: {
  //     x: -initialBoundaries.max.x * zoomComp,
  //     y: -initialBoundaries.max.y * zoomComp,
  //   },
  // };
  return initialBoundaries;
});

const translatePosition = reactive<Vector2>({ x: 0, y: 0 });

function getOffsetFromCenterCoef(value: number, vectorName: "x" | "y"): number {
  return Math.max(
    Math.abs(screenSize.center[vectorName] - value) / screenSize[vectorName] +
      minMoveFactor,
    0
  );
}

function tranformWindowsOnDrag(vel: Vector2, windows: WindowData[]): void {
  const zoom = zoomFactor.value;
  const zoomInvert = 1 - zoom;
  translatePosition.x += vel.x * (2 - zoom);
  translatePosition.y += vel.y * (2 - zoom);

  windows.forEach((window, index) => {
    const { x, y } = window.transform;

    const offsetFromCenter: Vector2 = {
      x: getOffsetFromCenterCoef(x, "x"),
      y: getOffsetFromCenterCoef(y, "y"),
    };
    const scale = getScaleCoef(offsetFromCenter);
    // select window if centered
    if (
      isBetween(offsetFromCenter.x, 0.5, 0.7) &&
      isBetween(offsetFromCenter.y, 0.5, 0.7) &&
      !translating.value &&
      !isMediaWindow(window.id)
    ) {
      setWindowSelection(window.id);
    }
    window.transformPreZoom.x += vel.x * (2 - zoom); // * offsetFromCenter.x;
    window.transformPreZoom.y += vel.y * (2 - zoom); //* offsetFromCenter.y;
    window.targetTransform.x =
      window.transformPreZoom.x * zoom + screenSize.center.x * zoomInvert;
    window.targetTransform.y =
      window.transformPreZoom.y * zoom + screenSize.center.y * zoomInvert;
    window.targetTransform.scale = window.hidden ? 0.2 : scale * zoom;
  });
}

function onStart({ x, y }: Vector2): void {
  // wait for a click on window. if no click, toggle zoom animation on move
  // if (!isWindowOpen.value) {
  if (!translating.value && !isWindowOpen.value && !dragDezooming) {
    setTimeout(() => {
      if (!dragDezooming && mouseDown) {
        dragDezooming = true;
        preTranslateZoomTarget = zoomTarget;
        zoomTarget = preTranslateZoomTarget * 0.8;
      }
    }, 100);
  }
  lastMousePos.x = x;
  lastMousePos.y = y;
  mouseDown = true;
  // }
}

function onEnd(): void {
  zoomTarget = preTranslateZoomTarget;
  setTimeout(() => {
    dragDezooming = false;
  }, 10);
  mouseDown = false;
}

// function keepInBounds() {
//   const bounds = effectiveBoundaries.value;
//   let diffX = 0;
//   let diffY = 0;
//   if (translatePosition.x > bounds.min.x) {
//     diffX = -10;
//   }
//   if (translatePosition.x < bounds.max.x) {
//     diffX = 10;
//   }
//   if (translatePosition.y > bounds.min.y) {
//     diffY = -10;
//   }
//   if (translatePosition.y < bounds.max.y) {
//     diffY = 10;
//   }
//   if (diffX || diffY) {
//     console.log("BOUNDARY BREAK");
//     if (screenSize.x < 600) {
//       diffX *= 0.75;
//       diffY *= 0.5;
//     }
//     mouseDown = false;
//     velocity.x += diffX;
//     velocity.y += diffY;
//   }
// }

function onMove({ x, y }: Vector2): void {
  targetMousePos.x = x;
  targetMousePos.y = y;
  if (mouseDown) {
    zoomTarget = zoomFactor.value;
    translating.value = false;
    const deltaX: number = x - lastMousePos.x;
    const deltaY: number = y - lastMousePos.y;

    velocity.x = deltaX * (2 - zoomFactor.value);
    if(!isWindowOpen.value) {
      velocity.y = deltaY * (2 - zoomFactor.value);
    }
  }
  lastMousePos.x = x;
  lastMousePos.y = y;
}

function onTouch(touchPositions: Vector2[]): void {
  isMobile.value = true;
  if (touchPositions.length === 1) {
    onMove(touchPositions[0]);
  }
}

function decreaseVelocity(dragFactor = 0.0) {
  velocity.x *= dragFactor;
  velocity.y *= dragFactor;
  if (
    (velocity.x > 0 && velocity.x < 0.000001) ||
    (velocity.x < 0 && velocity.x > -0.000001)
  ) {
    velocity.x = 0;
  }
  if (
    (velocity.y > 0 && velocity.y < 0.000001) ||
    (velocity.y < 0 && velocity.y > -0.000001)
  ) {
    velocity.y = 0;
  }
}

function setWindowSelection(selectId: number | string) {
  selectedId.id = selectId;
  windows.value.forEach((window) => {
    window.selected = window.id === selectId;
  });
}

const showSelectedProjectMediaWindows = (openWindowId: string) => {
  const selectedProjectMediaUids =
    PROJECTS.value
      .find((p) => p.uid === openWindowId)
      ?.media.map(({ uid }) => uid) || [];
  const mediaWindows = allWindows.value.filter(({ id }) =>
    selectedProjectMediaUids.includes(id)
  );
  mediaWindows.forEach((window) => {
    window.hidden = false;
  });
};

const hideAllProjectMediaWindows = () => {
  allWindows.value
    .filter(({ id }) => id.includes("media"))
    .forEach((window) => {
      window.hidden = true;
    });
};

function onOpen(windowId: string) {
  setWindowSelection(windowId);
  console.log("open", windowId);
  zoomTarget = 0.9;
  translating.value = true;

  windows.value.forEach((window) => {
    const isOpen = window.id === windowId;
    window.open = window.id === windowId;
    // hide other windows
    if (!isOpen) {
      window.hidden = true;
      // hideWindowIfNeeded(window);
    }
  });

  showSelectedProjectMediaWindows(windowId);
}

function onClose(windowId: string) {
  windows.value.forEach((window: WindowData) => {
    window.open = false;
    window.hidden = false;
  });
  hideAllProjectMediaWindows();
  selectWindow(windowId, false);
}

function getWindowById(windowId: number | string) {
  return allWindows.value.find(({ id }) => id === windowId);
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

function onMouseOver(windowId: string) {
  if (selectedId.id !== windowId && !isMediaWindow(windowId)) {
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
  tranformWindowsOnDrag(velocity, allWindows.value);
  translateToTargetPos();
  translateCursor();
  // keepInBounds();
  // keepInBoundaries(translatePosition, effectiveBoundaries.value);
  decreaseVelocity(translating ? dragFactor : 0);
}

const minimapItems = computed(() =>
  allWindows.value.map(({ transform, thumbnail, selected, id, hidden }) => ({
    transform: {
      x: transform.x,
      y: transform.y,
    },
    ratio: thumbnail.large.aspectRatio,
    selected,
    height: thumbnail.large.height,
    width: thumbnail.large.width,
    hidden,
    id,
  }))
);

const onResize = debounce(() => {
  baseWindowSize.x = isMobile.value ? 250 : 500;
  baseWindowSize.y = isMobile.value ? 250 : 500;
  const { x, y, center, ratio } = getScreenDims();
  screenSize.x = x;
  isMobile.value = x < 600;
  screenSize.y = y;
  screenSize.center = center;
  screenSize.ratio = ratio;
  setInitalBoundaries();
}, 500);

function setInitalBoundaries() {
  const bounds = createBoundaries(windows.value, baseWindowSize);
  initialBoundaries.top = bounds.top;
  initialBoundaries.bottom = bounds.bottom;
  initialBoundaries.left = bounds.left;
  initialBoundaries.right = bounds.right;
}

onMounted(async () => {
  const apiRes = await loadApi();

  if (apiRes && apiRes?.projects) {
    PROJECTS.value = apiRes.projects;
    windows.value = createProjectWindows(PROJECTS.value, baseWindowSize);
    const mediaWindows = createAllProjectsMediaWindows(
      PROJECTS.value,
      windows.value,
      baseWindowSize
    );

    // allProjectMediaWindows.value = Object.values(selectedProjectMediaWindows.value).flat(1)
    allWindows.value = [
      ...windows.value,
      ...mediaWindows
        .map(({ mediaWindows }) => mediaWindows)
        .flat(1),
    ];
    setInitalBoundaries();
    animate();
  }

  gestures = new GestureHandler({
    onStart,
    onEnd,
    onMove,
    onTouch,
    onWheel,
    onPinch,
  });

  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId);
  window.removeEventListener("resize", onResize);
  if (gestures) {
    gestures.destroy();
  }
});
</script>

<style lang="sass">
.dotted
  background-image: radial-gradient($c-grey-2 1px, transparent 0)
  background-size: 24px 24px
  background-position: center center
</style>
