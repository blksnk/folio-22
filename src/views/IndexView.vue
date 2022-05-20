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
      :onSelect="apiData.selectWindow"
    />
    <ProjectText/>
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
} from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";

import FixedFrame from "@/components/FixedFrame.vue";
import Window from "@/components/Window.vue";
import Minimap from "@/components/Minimap.vue";

import {
  createBoundaries,
  keepInBoundaries,
  isMediaWindow,
  generateWindowSize,
  computeZoomTarget,
} from "@/utils/layout";
import {
  ScreenDims,
  Boundary,
WindowData,
} from "@/utils/layout.types";
import { ArrowDirection } from "@/utils/gestures.types";
import { onIndexEnter, onIndexLeave } from "@/utils/transition";
import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { useGestureData } from "@/stores/gestureData";
import ProjectText from "@/components/ProjectText.vue";

const mouseData = useMouseData();
const apiData = useApiData();
const gestureData = useGestureData();

let screenSize = reactive<ScreenDims>(getScreenDims());


const initialBoundaries = reactive<Boundary>({
  top: -10000,
  bottom: 10000,
  left: -10000,
  right: 10000,
});

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
  apiData.selectWindow(windowId, false, undefined, 0.75);

  showSelectedProjectMediaWindows(windowId);
}

function onClose(windowId?: string) {
  apiData.closeWindow(windowId)
}

const onWindowClick = (targetId: string, ...args: unknown[]) => {
  if(apiData.getWindowById(targetId)?.hidden) {
    return
  }
  if(isMediaWindow(targetId)) {
    apiData.selectWindow(targetId, false)
  }
  else if(apiData.selectedId === targetId && apiData.openWindow?.id !== targetId) {
    onOpen(targetId)
  } else {
    apiData.selectWindow(targetId, false)
  }
  onMouseOver(targetId)
}

function onMouseOver(windowId: string) {
  const window = apiData.getWindowById(windowId);
  if (
    // apiData.selectedId !== windowId &&
    window &&
    !window.hidden
  ) {
    const isMedia = isMediaWindow(windowId)
    const isWindowOpen = apiData.openWindow !== undefined
    let isNextWindow = false
    if( isWindowOpen ) {
      const hoveringIndex = apiData.visibleOpenWindows.indexOf(window)
      isNextWindow = hoveringIndex > apiData.selectedVisibleOpenWindowIndex      
    }
    mouseData.showCursor = isMedia ? !window.selected : window.open ? !window.selected : true;
    mouseData.cursorIcon = isWindowOpen ? isNextWindow ? 'arrow-forward-sharp' : 'arrow-back-sharp' :
      apiData.selectedId !== windowId
        ? "eye-outline"
        : "resize-sharp";
  }
}

function onMouseLeave() {
  mouseData.showCursor = false;
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
      selectedIndex = apiData.selectedVisibleOpenWindowIndex
      switch (direction) {
        case ArrowDirection.ArrowLeft:
          if (selectedIndex > 0) {
            newIndex = selectedIndex - 1;
          }
          break;
        case ArrowDirection.ArrowRight:
          if (selectedIndex < apiData.visibleOpenWindows.length - 1) {
            newIndex = selectedIndex + 1;
          }
          break;
        default:
          newIndex = selectedIndex;
          console.log("direction not supported");
      }
      selectedId = (apiData.visibleOpenWindows[newIndex] as WindowData).id
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
    if (newIndex !== selectedIndex) {
      apiData.selectWindow(selectedId);
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
    if(apiData.loaderAnimationFinished) {
      await onIndexEnter();
    }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  gestureData.translating = false;
});

onBeforeRouteUpdate(onIndexEnter);

onBeforeRouteLeave(
  onIndexLeave(() => {
    mouseData.showCursor = false;
  })
);
</script>
