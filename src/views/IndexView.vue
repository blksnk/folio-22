<template>
  <FixedFrame
    class="dotted"
    @close="() => onClose(apiData.openWindow?.id)"
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
      :hidden="window.hidden"
      :screenSize="screenSize"
      :tags="window?.tags"
      @click="() => onWindowClick(window.id)"
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
  ref,
  watchEffect,
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
import { ArrowDirection } from "@/utils/gestures.types";
import { onIndexEnter, onIndexLeave } from "@/utils/transition";
import { clamp, getScaleCoef, largestAbsolute, isBetween } from "@/utils/math";
import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { useGestureData, velocity } from "@/stores/gestureData";

const mouseData = useMouseData();
const apiData = useApiData();
const gestureData = useGestureData();

let screenSize = reactive<ScreenDims>(getScreenDims());

let mouseDown = false;
// let lastMousePos: Vector2 = { x: 0, y: 0 };
// let velocity = reactive<Vector2>({ x: 0, y: 0 });

let minMoveFactor = 0.55;
let dragFactor = 0.85;
let frameId = 0;
// let translating = ref<boolean>(false);
// let selectedId = reactive<{ id: string | number }>({ id: 0 });
let gestures: GestureHandler | undefined;

const initialBoundaries = reactive<Boundary>({
  top: -10000,
  bottom: 10000,
  left: -10000,
  right: 10000,
});

function getOffsetFromCenterCoef(value: number, vectorName: "x" | "y"): number {
  return Math.max(
    Math.abs(screenSize.center[vectorName] - value) / screenSize[vectorName] +
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
      setWindowSelection(window.id);
    }
    window.transformPreZoom.x += velocity.x * (2 - zoom); // * offsetFromCenter.x;
    window.transformPreZoom.y += velocity.y * (2 - zoom); //* offsetFromCenter.y;
    window.targetTransform.x =
      window.transformPreZoom.x * zoom + screenSize.center.x * zoomInvert;
    window.targetTransform.y =
      window.transformPreZoom.y * zoom + screenSize.center.y * zoomInvert;
    window.targetTransform.scale = scale * zoom;
  });
}

function onStart({ x, y }: Vector2): void {
  // wait for a click on window. if no click, toggle zoom animation on move

//   if (!gestureData.translating && !apiData.isWindowOpen && !gestureData.dragDezooming) {
//     setTimeout(() => {
//       if (!gestureData.dragDezooming && mouseDown) {
//         gestureData.dragDezooming = true;
//         gestureData.preTranslateZoomTarget = gestureData.zoomTarget;
//         gestureData.zoomTarget = gestureData.preTranslateZoomTarget * 0.8;
//       }
//     }, 100);
//   }
//  mouseData.lastMousePos.x = x;
//  mouseData.lastMousePos.y = y;
//   mouseDown = true;
}

function onEnd(): void {
  // gestureData.zoomTarget = gestureData.preTranslateZoomTarget;
  // setTimeout(() => {
  //   gestureData.dragDezooming = false;
  // }, 10);
  // mouseDown = false;
}

function onMove(
  fromTouch: Vector2,
  { x, y }: Vector2,
  fromTrackpad?: boolean
): void {
  // if (mouseDown || fromTrackpad) {
    // zoomTarget = zoomFactor.value;
    // gestureData.translating = false;
    // const deltaX: number = x - mouseData.lastMousePos.x;
    // const deltaY: number = y - mouseData.lastMousePos.y;

    // velocity.x = x * (2 - gestureData.zoomFactor);
    // if (!apiData.isWindowOpen) {
    //   velocity.y = y * (2 - gestureData.zoomFactor);
    // }
  // }

  // if (fromTouch && !fromTrackpad) {
  // }
  // mouseData.lastMousePos.x = x;
  // mouseData.lastMousePos.y = y;
}

function onTouch(touchPositions: Vector2[]): void {
  // console.log(touchPositions.length)
  // if (touchPositions.length === 1) {
  //   onMove(
  //     { x: 0, y: 0 },
  //     {
  //       x: touchPositions[0].x - mouseData.lastMousePos.x,
  //       y: touchPositions[0].y - mouseData.lastMousePos.y,
  //     }
  //   );
  //  mouseData.lastMousePos.x = touchPositions[0].x;
  //  mouseData.lastMousePos.y = touchPositions[0].y;
  // }
  // // else {
  // // }
}

function decreaseVelocity(dragFactor = 0.0) {
  velocity.x *= dragFactor;
  velocity.y *= dragFactor;
  // if (
  //   Math.abs(velocity.x) < 0.000001
  // ) {
  //   velocity.x = 0;
  // }
  // if (
  //   (velocity.y > 0 && velocity.y < 0.000001) ||
  //   (velocity.y < 0 && velocity.y > -0.000001)
  // ) {
  //   velocity.y = 0;
  // }
}

function setWindowSelection(selectId: number | string) {
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

function onClose(windowId?: string) {
  apiData.hideAllProjectMediaWindows();
  if (windowId) {
    selectWindow(windowId, false, undefined, 0.5);
  }
  apiData.showAllProjectWindows();
}

const onWindowClick = (targetId: string, ...args: unknown[]) => {
  if(apiData.getWindowById(targetId)?.hidden) {
    return
  }
  if(isMediaWindow(targetId)) {
    selectWindow(targetId, false)
  }
  else if(apiData.selectedId === targetId && apiData.openWindow?.id !== targetId) {
    onOpen(targetId)
  } else {
    selectWindow(targetId, false)
  }
  onMouseOver(targetId)
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
    apiData.selectedId = targetId;
    gestureData.translating = true;
    
    setWindowSelection(targetId);
    // if (!isMediaWindow(String(targetId))) {
    //   mouseData.showCursor = true;
    //   if (!window.open) {
    //     mouseData.cursorIcon = "folder-open-outline";
    //   }
    // } else {
    //   mouseData.showCursor = false;
    // }

    const zoom =
      zt ||
      computeZoomTarget(
        generateWindowSize(
          window.thumbnail.original.aspectRatio,
          apiData.baseWindowSize
        ),
        apiData.isMobile ? 100 : 300
      );
    gestureData.zoomTarget = zoom;
    gestureData.preTranslateZoomTarget = zoom;
  }
};

function translateToTargetPos() {
  if (apiData.selectedWindow && gestureData.translating) {
    const { x, y } = apiData.selectedWindow.transform;
    const dstToTarget = {
      x: screenSize.center.x - x,
      y: screenSize.center.y + 24 - y,
    };

    const needsTranslate =
      Math.max(Math.abs(dstToTarget.x), Math.abs(dstToTarget.y)) > 1;

    if (needsTranslate) {
      velocity.x += dstToTarget.x * 0.005;
      velocity.y += (dstToTarget.y * 0.005) / screenSize.ratio;
    } else if (gestureData.translating) {
      console.log('reset translating', apiData.selectedId)
      gestureData.translating = false;
      setWindowSelection(apiData.selectedId);
    }
  }
}

function onWheel({ x, y }: Vector2) {
  // const target = clamp(gestureData.zoomTarget - largestAbsolute(x, y) / 500, 0.2, 1.6);
  // gestureData.zoomTarget = target
  // // gestureData.preTranslateZoomTarget = target
}

function onPinch({ x, y }: Vector2) {
  // onWheel({ x, y })
}

function applyZoom() {
  gestureData.zoomFactor += (gestureData.zoomTarget - gestureData.zoomFactor) * 0.05;
}

function onMouseOver(windowId: string) {
  const window = apiData.getWindowById(windowId);
  if (
    // apiData.selectedId !== windowId &&
    window &&
    !window.hidden
  ) {
    mouseData.showCursor = isMediaWindow(windowId) ? !window.selected : window.open ? !window.selected : true;
    mouseData.cursorIcon =
      isMediaWindow(windowId) || window.open || apiData.selectedId !== windowId
        ? "eye-outline"
        : "expand-sharp";
  }
}

function onMouseLeave() {
  mouseData.showCursor = false;
}

function animate(): void {
  frameId = requestAnimationFrame(animate);
  applyZoom();
  translateToTargetPos();
  tranformWindowsOnDrag();
  // keepInBounds();
  // keepInBoundaries(translatePosition, effectiveBoundaries.value);
  // decreaseVelocity(gestureData.translating ? dragFactor : 0);
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

// TODO: fix translateToTargetPos on new screenSize
const onResize = debounce(() => {
  const { x, y, center, ratio } = getScreenDims();
  screenSize.x = x;
  screenSize.y = y;
  screenSize.center = center;
  screenSize.ratio = ratio;
  // setInitalBoundaries();
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

const selectWithKeyboard = (direction: string | ArrowDirection) => {
  // get selected window index
  if (apiData.selectedWindow) {
    let newIndex = 0, selectedIndex = 0, selectedId = "";
    if (apiData.isWindowOpen && apiData?.openWindow) {
      const mediaWins = apiData.mediaWindows.find(({ projectUid }) => projectUid === apiData.openWindow?.id)
      const windows = [ apiData.openWindow, ...(mediaWins?.mediaWindows || []) ]
      selectedIndex = windows.indexOf(apiData.selectedWindow)
      console.log(selectedIndex)
      switch (direction) {
        case ArrowDirection.ArrowLeft:
          if (selectedIndex > 0) {
            newIndex = selectedIndex - 1;
          }
          break;
        case ArrowDirection.ArrowRight:
          if (selectedIndex <= windows.length - 1) {
            newIndex = selectedIndex + 1;
          }
          break;
        default:
          newIndex = selectedIndex;
          console.log("direction not supported");
      }
      selectedId = windows[newIndex].id
    } else {
      selectedIndex = apiData.projectWindows.indexOf(
        apiData.selectedWindow
      );
      const isTop = selectedIndex % 2 === 0;
      switch (direction) {
        case ArrowDirection.ArrowUp:
          if (!isTop) {
            newIndex = selectedIndex - 1;
          }
          break;
        case ArrowDirection.ArrowDown:
          if (isTop) {
            newIndex = selectedIndex + 1;
          }
          break;
        case ArrowDirection.ArrowLeft:
          if (selectedIndex >= 2) {
            newIndex = selectedIndex - 2;
          }
          break;
        case ArrowDirection.ArrowRight:
          if (selectedIndex <= apiData.projectWindows.length - 3) {
            newIndex = selectedIndex + 2;
          }
          break;
        default:
          newIndex = selectedIndex;
          console.log("direction not supported");
      }
      selectedId = apiData.projectWindows[newIndex].id;
    }
    console.log(newIndex);
    if (newIndex !== selectedIndex) {
      selectWindow(selectedId);
    }
  }
};

const onKeyDown = (e: KeyboardEvent) => {};

const onKeyUp = (e: KeyboardEvent) => {
  const { key } = e;
  console.log(key);
  selectWithKeyboard(key);
};

onMounted(async () => {
  setInitalBoundaries();
    if(!apiData.loaderAnimationFinished) {
      animate();
      setTimeout(() => {
        apiData.indexEnterFinished = true
      }, 1000)
    } else {
      await onIndexEnter();
      animate();

    }

  // gestures = new GestureHandler({
  //   onStart,
  //   onEnd,
  //   onMove,
  //   onTouch,
  //   onWheel,
  //   onPinch,
  //   preventDefault: true,
  // });

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
});

onBeforeUnmount(() => {
  // cancelAnimationFrame(frameId);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  gestureData.translating = false;
  // if (gestures) {
  //   gestures.destroy();
  // }
});

onBeforeRouteUpdate(onIndexEnter);

onBeforeRouteLeave(
  onIndexLeave(() => {
    if (gestures) {
      gestures.destroy();
    }
    mouseData.showCursor = false;
  })
);
</script>
