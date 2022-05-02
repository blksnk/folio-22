<template>
  <FixedFrame
    class="dotted"
    @close="() => onClose(openWindow?.id)"
    :displayTitle="isWindowOpen"
    :title="openWindow?.title"
    id="page__index"
    ref="frameRef"
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
      :baseSize="baseWindowSize"
      :screenSize="screenSize"
      :tags="window?.tags"
      @mouseup="() => selectWindow(window.id, false)"
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
import {
  reactive,
  onBeforeUnmount,
  onMounted,
  computed,
  defineProps,
  ref,
  watch,
  defineEmits,
} from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { debounce } from "lodash";

import FixedFrame from "@/components/FixedFrame.vue";
import Window from "@/components/Window.vue";
import Minimap from "@/components/Minimap.vue";

import GestureHandler from "@/utils/gesture";
import {
  createBoundaries,
  keepInBoundaries,
  translateFrame,
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
import { clamp, getScaleCoef, largestAbsolute, isBetween } from "@/utils/math";
import { PageProps } from "@/utils/gestures.types";
import { useApiData } from "@/stores/apiData";

interface IndexPageProps extends PageProps {}

const props = defineProps<IndexPageProps>();

const emit = defineEmits([
  "update:showCursor",
  "update:cursorText",
  "update:cursorIcon",
]);

let screenSize = reactive<ScreenDims>(getScreenDims());

const baseWindowSize = reactive<Vector2>({
  x: props.isMobile ? 250 : 500,
  y: props.isMobile ? 250 : 500,
});

let mouseDown = false;
let lastMousePos: Vector2 = { x: 0, y: 0 };
let velocity = reactive<Vector2>({ x: 0, y: 0 });

let minMoveFactor = 0.55;
let dragFactor = 0.9;
let frameId = 0;
let translating = reactive({ value: false });
let selectedId = reactive<{ id: string | number }>({ id: 0 });
let gestures: GestureHandler | undefined;
let zoomFactor = reactive({ value: 0.15 });
let preTranslateZoomTarget = props.isMobile ? 0.8 : 0.5;
let zoomTarget = props.isMobile ? 0.8 : 0.6;
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
const allWindows = ref<WindowData[]>([]);

const selectedWindow = computed<WindowData | undefined>(() =>
  apiData.allWindows.find((el) => el.id === selectedId.id)
);

const frameRef = ref<HTMLElement | null>(null);

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

const apiData = useApiData()

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
    // window.targetTransform.scale = window.hidden ? 0.2 : scale * zoom;
    window.targetTransform.scale = scale * zoom;
  });
}

function onStart({ x, y }: Vector2): void {
  // wait for a click on window. if no click, toggle zoom animation on move
  // if (!isWindowOpen.value) {

  console.log('aaaaaa')
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

function onMove(_: Vector2, { x, y }: Vector2, fromTrackpad?: boolean): void {
  if (mouseDown || fromTrackpad) {
    // zoomTarget = zoomFactor.value;
    translating.value = false;
    // const deltaX: number = x - lastMousePos.x;
    // const deltaY: number = y - lastMousePos.y;

    velocity.x = x * (2 - zoomFactor.value);
    if (!isWindowOpen.value) {
      velocity.y = y * (2 - zoomFactor.value);
    }
  }
  // lastMousePos.x = x;
  // lastMousePos.y = y;
}

function onTouch(touchPositions: Vector2[]): void {
  // isMobile.value = true;
  if (touchPositions.length === 1) {
    onMove({ x: 0, y: 0 }, touchPositions[0]);
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

const hideAllProjectMediaWindows = () => {
  apiData.allWindows
    .filter(({ id }) => id.includes("media"))
    .forEach((window) => {
      window.hidden = true;
      window.selected = false;
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
  hideAllProjectMediaWindows();
  selectWindow(windowId, false, undefined, 0.5);
  apiData.projectWindows.forEach((window: WindowData) => {
    window.open = false;
    window.hidden = false;
  });
}

function getWindowById(windowId: number | string) {
  return apiData.allWindows.find(({ id }) => id === windowId);
}

const selectWindow = (
  targetId: number | string,
  forceShowCursor = false,
  event?: MouseEvent,
  zt?: number
) => {
  const window = getWindowById(targetId);
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (
    window &&
    (selectedId.id !== targetId || openWindow.value?.id === targetId) &&
    !window.hidden
  ) {
    selectedId.id = targetId;
    translating.value = true;
    // default to hiding cursor on click
    emit("update:showCursor", forceShowCursor);
    const zoom =
      zt ||
      computeZoomTarget(
        generateWindowSize(
          window.thumbnail.original.aspectRatio,
          baseWindowSize
        )
      );
    console.log("zoom", zoom);
    zoomTarget = zoom;
    preTranslateZoomTarget = zoom;
    setWindowSelection(targetId);
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

function onMouseOver(windowId: string) {
  if (selectedId.id !== windowId && !getWindowById(windowId)?.hidden) {
    emit("update:showCursor", true);
    emit("update:cursorIcon", "eye-outline");

    if (isMediaWindow(windowId)) {
      emit("update:cursorText", "View");
      emit("update:cursorIcon", undefined);
    }
  }
}

function onMouseLeave() {
  emit("update:showCursor", false);
}


function animate(): void {
  frameId = requestAnimationFrame(animate);
  applyZoom();
  tranformWindowsOnDrag(velocity, apiData.allWindows);
  translateToTargetPos();
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

watch(
  () => props.isMobile,
  (m) => {
    baseWindowSize.x = m ? 250 : 500;
    baseWindowSize.y = m ? 250 : 500;
  }
);


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
  const bounds = createBoundaries(apiData.projectWindows, baseWindowSize);
  initialBoundaries.top = bounds.top;
  initialBoundaries.bottom = bounds.bottom;
  initialBoundaries.left = bounds.left;
  initialBoundaries.right = bounds.right;
}

onMounted(async () => {
    setInitalBoundaries();
    const el = document.getElementById("page__index");
    if (el) {
      setTimeout(() => {
        translateFrame(el, 1);
        animate();
      }, 500);
    }
  // }

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

onBeforeUnmount(() => {
  // cancelAnimationFrame(frameId);
  window.removeEventListener("resize", onResize);
  if (gestures) {
    gestures.destroy();
  }
});

// onBeforeRouteLeave(
//   () =>
//     new Promise((resolve, reject) => {
//       const el = document.getElementById("page__index");
//       if (el) {
//         console.log(el);
//         translateFrame(el, 0);
//         setTimeout(() => resolve(true), 600);
//       } else resolve(false);
//     })
// );
</script>
