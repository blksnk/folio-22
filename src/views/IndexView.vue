<template>
  <FixedFrame
    class="dotted"
    @close="() => onClose(apiData.openWindow?.id)"
    :displayTitle="isWindowOpen"
    :title="openWindow?.title"
    id="page__index"
  >
    <Window
      v-for="window in apiData.allWindows"
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
      :screenSize="screenSize"
      :tags="window?.tags"
      @mouseup="() => selectWindow(window.id, false)"
      @touchend="() => selectWindow(window.id, false)"
      @mouseover="onMouseOver(window.id)"
      @mouseleave="onMouseLeave()"
      @buttonOver="onMouseLeave()"
      @buttonLeave="onMouseOver(window.id)"
      @open="onOpen(window.id)"
    />
    <Minimap
      :items="minimapItems"
      :screenSize="screenSize"
      :onSelect="selectWindow"
      :zoomFactor="zoomFactor"
    />
  </FixedFrame>
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
import { reactive, onBeforeUnmount, onMounted, computed, ref, watchEffect } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { debounce } from "lodash";

import FixedFrame from "@/components/FixedFrame.vue";
import Window from "@/components/Window.vue";
import Minimap from "@/components/Minimap.vue";

import GestureHandler from "@/utils/gesture";
import {
  createBoundaries,
  keepInBoundaries,
  isMediaWindow,
  generateWindowSize,
  computeZoomTarget,
} from "@/utils/layout";
import {
  WindowData,
  ScreenDims,
  Boundary,
  Vector2,
} from "@/utils/layout.types";
import { onIndexEnter, onIndexLeave } from "@/utils/transition";
import { clamp, getScaleCoef, largestAbsolute, isBetween } from "@/utils/math";
import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";

const mouseData = useMouseData();
const apiData = useApiData();

let screenSize = reactive<ScreenDims>(getScreenDims());

let mouseDown = false;
let lastMousePos: Vector2 = { x: 0, y: 0 };
let velocity = reactive<Vector2>({ x: 0, y: 0 });

let minMoveFactor = 0.55;
let dragFactor = 0.9;
let frameId = 0;
let translating = reactive({ value: false });
// let selectedId = reactive<{ id: string | number }>({ id: 0 });
let gestures: GestureHandler | undefined;
let zoomFactor = reactive({ value: 0.15 });
let preTranslateZoomTarget = apiData.isMobile ? 0.8 : 0.5;
let zoomTarget = apiData.isMobile ? 0.8 : 0.6;
let dragDezooming = false;

let debugLine = reactive<Vector2>({ x: 0, y: 0 });
const initialBoundaries = reactive<Boundary>({
  top: -10000,
  bottom: 10000,
  left: -10000,
  right: 10000,
});

const isWindowOpen = computed<boolean>(() =>
  apiData.projectWindows.some((el: WindowData) => el.open)
);

const openWindow = computed<WindowData | undefined>(() =>
  apiData.projectWindows.find((el: WindowData) => el.open)
);

// const selectedWindow = computed<WindowData | undefined>(() =>
//   apiData.allWindows.find((el) => el.id === selectedId.id)
// );

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
      // apiData.selectedId !== window.id
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

function onStart({ x, y }: Vector2): void {
  // wait for a click on window. if no click, toggle zoom animation on move

  if (!translating.value && !apiData.isWindowOpen && !dragDezooming) {
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
}

function onEnd(): void {
  zoomTarget = preTranslateZoomTarget;
  setTimeout(() => {
    dragDezooming = false;
  }, 10);
  mouseDown = false;
}

function onMove(
  fromTouch: Vector2,
  { x, y }: Vector2,
  fromTrackpad?: boolean
): void {
  if (mouseDown || fromTrackpad) {
    // zoomTarget = zoomFactor.value;
    translating.value = false;
    // const deltaX: number = x - lastMousePos.x;
    // const deltaY: number = y - lastMousePos.y;

    velocity.x = x * (2 - zoomFactor.value);
    if (!apiData.isWindowOpen) {
      velocity.y = y * (2 - zoomFactor.value);
    }
  }

  if (fromTouch && !fromTrackpad) {
  }
  // lastMousePos.x = x;
  // lastMousePos.y = y;
}

function onTouch(touchPositions: Vector2[]): void {
  if (touchPositions.length === 1) {
    onMove(
      { x: 0, y: 0 },
      {
        x: touchPositions[0].x - lastMousePos.x,
        y: touchPositions[0].y - lastMousePos.y,
      }
    );
    lastMousePos.x = touchPositions[0].x;
    lastMousePos.y = touchPositions[0].y;
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
  // apiData.selectedId = selectId
  apiData.allWindows.forEach((window) => {
    window.selected = window.id === selectId;
  });
}

const showSelectedProjectMediaWindows = (openWindowId: string) => {
  const selectedProjectMediaUids =
    apiData.projects
      .find((p) => p.uid === openWindowId)
      ?.media.map(({ uid }) => uid) || [];
  const mediaWindows = apiData.allWindows.filter(({ id }) =>
    selectedProjectMediaUids.includes(id)
  );
  mediaWindows.forEach((window) => {
    window.hidden = false;
  });
};

function onOpen(windowId: string) {
  apiData.projectWindows.forEach((window) => {
    const isOpen = window.id === windowId;
    window.open = isOpen;
    // hide other windows
    if (!isOpen) {
      window.hidden = true;
    }
  });
  selectWindow(windowId, false, undefined, 0.75);

  showSelectedProjectMediaWindows(windowId);
}

function onClose(windowId: string) {
  apiData.hideAllProjectMediaWindows();
  selectWindow(windowId, false, undefined, 0.5);
  apiData.showAllProjectWindows()
}

const selectWindow = (
  targetId: number | string,
  forceShowCursor = false,
  event?: MouseEvent,
  zt?: number
) => {
  const window = apiData.getWindowById(targetId);
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (
    window &&
    (apiData.selectedId !== targetId || apiData.openWindow?.id === targetId) &&
    !window.hidden
  ) {
    console.log("selected", window.title);
    console.log("\n\n");

    
    apiData.selectedId = targetId;
    setWindowSelection(targetId)
    // default to hiding cursor on click
    mouseData.showCursor = forceShowCursor;
    // emit("update:showCursor", forceShowCursor);
    mouseData;
    const zoom =
      zt ||
      computeZoomTarget(
        generateWindowSize(
          window.thumbnail.original.aspectRatio,
          apiData.baseWindowSize
        ),
        apiData.isMobile ? 100 : 300
      );
    zoomTarget = zoom;
    preTranslateZoomTarget = zoom;
    // setWindowSelection(targetId);
    translating.value = true;
  }
};

function translateToTargetPos() {
  // const selected = apiData.getWindowById(apiData.selectedId);
  if (apiData.selectedWindow && translating.value) {
    const { x, y } = apiData.selectedWindow.transform;
    const dstToTarget = {
      x: screenSize.center.x - x,
      y: screenSize.center.y - y,
    };

    const needsTranslate =
      Math.max(Math.abs(dstToTarget.x), Math.abs(dstToTarget.y)) > 1;

    if (needsTranslate) {
      velocity.x += dstToTarget.x * 0.005;
      velocity.y += (dstToTarget.y * 0.005) / screenSize.ratio;
    } else if (translating.value) {
      translating.value = false;
      setWindowSelection(apiData.selectedId)
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

function onMouseOver(windowId: string) {
  if (
    apiData.selectedId !== windowId &&
    !apiData.getWindowById(windowId)?.hidden
  ) {
    mouseData.showCursor = true;
    mouseData.cursorIcon = "eye-outline";
    // emit("update:showCursor", true);
    // emit("update:cursorIcon", "eye-outline");

    if (isMediaWindow(windowId)) {
      mouseData.cursorText = "View";
      mouseData.cursorIcon = undefined;
      // emit("update:cursorText", "View");
      // emit("update:cursorIcon", undefined);
    }
  }
}

function onMouseLeave() {
  mouseData.showCursor = false;
  // emit("update:showCursor", false);
}

function animate(): void {
  frameId = requestAnimationFrame(animate);
  applyZoom();
  translateToTargetPos();
  tranformWindowsOnDrag(velocity, apiData.allWindows);
  // translateCursor();
  // keepInBounds();
  // keepInBoundaries(translatePosition, effectiveBoundaries.value);
  decreaseVelocity(translating ? dragFactor : 0);
}

const minimapItems = computed(() =>
  apiData.allWindows.map(({ transform, thumbnail, selected, id, hidden }) => ({
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

// watch(
//   () => props.isMobile,
//   (m) => {
//     baseWindowSize.x = m ? 250 : 500;
//     baseWindowSize.y = m ? 250 : 500;
//   }
// );

const onResize = debounce(() => {
  const { x, y, center, ratio } = getScreenDims();
  // isMobile.value = x < 600;
  // baseWindowSize.x = isMobile.value ? 250 : 500;
  // baseWindowSize.y = isMobile.value ? 250 : 500;
  screenSize.x = x;
  screenSize.y = y;
  screenSize.center = center;
  screenSize.ratio = ratio;
  setInitalBoundaries();
}, 500);

function setInitalBoundaries() {
  const bounds = createBoundaries(
    apiData.projectWindows,
    apiData.baseWindowSize
  );
  initialBoundaries.top = bounds.top;
  initialBoundaries.bottom = bounds.bottom;
  initialBoundaries.left = bounds.left;
  initialBoundaries.right = bounds.right;
}

onMounted(async () => {
  setInitalBoundaries();
  onIndexEnter();
  animate();

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
});

watchEffect(() => {
  console.log(apiData.selectedWindow)
})

onBeforeUnmount(() => {
  // cancelAnimationFrame(frameId);
  window.removeEventListener("resize", onResize);
  translating.value = false;
  if (gestures) {
    gestures.destroy();
  }
});

onBeforeRouteUpdate(onIndexEnter);

onBeforeRouteLeave(
  onIndexLeave(() => {
    if (gestures) {
      gestures.destroy();
    }
  })
);
</script>
