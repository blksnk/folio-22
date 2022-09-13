<template>
  <FixedFrame
    id="page__index"
    class="dotted"
    @close="() => onClose(apiData.openWindow?.id)"
  >
    <Window
      v-for="window in apiData.allWindows"
      :id="window.id"
      :key="window.id"
      :hidden="window.hidden"
      :open="window.open || isMediaWindow(window.id)"
      :selected="window.selected"
      :tags="window?.tags"
      :thumbnail="window.thumbnail"
      :title="window.title"
      :transform="window.transform"
      @buttonLeave="onMouseOver(window.id)"
      @buttonOver="onMouseLeave()"
      @click="() => onWindowClick(window.id)"
      @mouseleave="onMouseLeave()"
      @mouseover="onMouseOver(window.id)"
      @open="onOpen(window.id)"
    />
    <Minimap />
    <ProjectText />
  </FixedFrame>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";

import FixedFrame from "@/components/FixedFrame.vue";
import Window from "@/components/Window.vue";
import Minimap from "@/components/Minimap.vue";

import { isMediaWindow } from "@/utils/layout";
import { WindowData } from "@/utils/layout.types";
import { ArrowDirection } from "@/utils/gestures.types";
import { onIndexEnter, onIndexLeave } from "@/utils/transition";
import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { useGestureData } from "@/stores/gestureData";
import ProjectText from "@/components/ProjectText.vue";
import {initObserver, updateObserverTargets} from "@/utils/intersection";
import { isBetween } from "@/utils/math";

const mouseData = useMouseData();
const apiData = useApiData();
const gestureData = useGestureData();
const route = useRoute();
const router = useRouter();

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
  if(apiData.observer) {
    updateObserverTargets(apiData.observer, () => {
      apiData.windowVisibilities = []
    }, apiData.visibleOpenWindows.filter(window => window !== undefined))
  }
}

function onClose(windowId?: string) {
  apiData.closeWindow(windowId);
  if(apiData.observer) {
    updateObserverTargets(apiData.observer, () => {
      apiData.windowVisibilities = []
    }, apiData.projectWindows)
  }
}

const onWindowClick = (targetId: string, ...args: unknown[]) => {
  if (apiData.getWindowById(targetId)?.hidden || mouseData.hasMoved) {
    return;
  }
  if (isMediaWindow(targetId)) {
    apiData.selectWindow(targetId, false);
  } else if (
    apiData.selectedId === targetId &&
    apiData.openWindow?.id !== targetId
  ) {
    onOpen(targetId);
  } else {
    apiData.selectWindow(targetId, false);
  }
  onMouseOver(targetId);
};

function onMouseOver(windowId: string) {
  const window = apiData.getWindowById(windowId);
  if (
    // apiData.selectedId !== windowId &&
    window &&
    !window.hidden
  ) {
    const isMedia = isMediaWindow(windowId);
    const isWindowOpen = apiData.openWindow !== undefined;
    let isNextWindow = false;
    if (isWindowOpen) {
      const hoveringIndex = apiData.visibleOpenWindows.indexOf(window);
      isNextWindow = hoveringIndex > apiData.selectedVisibleOpenWindowIndex;
    }
    mouseData.showCursor = isMedia
      ? !window.selected
      : window.open
      ? !window.selected
      : true;
    mouseData.cursorIcon = isWindowOpen
      ? isNextWindow
        ? 'arrow-forward-sharp'
        : 'arrow-back-sharp'
      : apiData.selectedId !== windowId
      ? "eye-outline"
      : "resize-sharp";
  }
}

function onMouseLeave() {
  mouseData.showCursor = false;
}

const selectWithKeyboard = (direction: string | ArrowDirection) => {
  // get selected window index
  if (apiData.selectedWindow) {
    let newIndex = 0,
      selectedIndex = 0,
      selectedId = "";
    if (apiData.isWindowOpen && apiData?.openWindow) {
      selectedIndex = apiData.selectedVisibleOpenWindowIndex;
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
      }
      selectedId = (apiData.visibleOpenWindows[newIndex] as WindowData).id;
    } else {
      selectedIndex = apiData.projectWindows.indexOf(apiData.selectedWindow);
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

const onKeyUp = (e: KeyboardEvent) => {
  const { key } = e;
  selectWithKeyboard(key);
};

const isWindowVisible = (entry: IntersectionObserverEntry) => {
  const centerX =
    entry.boundingClientRect.left + entry.boundingClientRect.width / 2;
  const centerY =
    entry.boundingClientRect.top + entry.boundingClientRect.height / 2;
  const limitX = entry.boundingClientRect.width * 0.25;
  const limitY = entry.boundingClientRect.height * 0.25;
  return (
    isBetween(centerX, limitX, window.innerWidth - limitX) &&
    isBetween(centerY, limitY, window.innerHeight - limitY) &&
    !entry.target.classList.contains("hidden")
  );
};

const onIntersect = (entries: IntersectionObserverEntry[]) => {
  // on init
  if (apiData.windowVisibilities.length <= entries.length) {
    apiData.windowVisibilities = entries.map((entry) => ({
      isVisible: isWindowVisible(entry),
      id: entry.target.id,
    }));
  } else {
    // change stored visibily based on window id
    entries.forEach((entry) => {
      const storedEntry = apiData.windowVisibilities.find(
        (windowVisibility) => windowVisibility.id === entry.target.id
      );
      if (storedEntry) {
        const entryIndex = apiData.windowVisibilities.indexOf(storedEntry);
        const update = {
          isVisible: isWindowVisible(entry) && !apiData.getWindowById(entry.target.id)?.hidden,
          id: entry.target.id,
        };
        apiData.windowVisibilities[entryIndex] = update;
        // move to last visible window if none visible
        if (apiData.visibleWindows.length === 0) {
          apiData.lastVisibleWindowId = update.id;
          apiData.outOfBounds = true;
        } else if (apiData.outOfBounds) {
          apiData.lastVisibleWindowId = null;
          apiData.outOfBounds = false;
        }
      }
    });
  }
};

watch(
  () => apiData.loaderAnimationFinished,
  async (value) => {
    window.removeEventListener("keyup", onKeyUp);
    if (value) {
      try {
        apiData.observer = initObserver(onIntersect);
      } catch (e) {
        if (!apiData.observer) {
          apiData.observer = initObserver(onIntersect);
        }
      }
      if (!apiData.observer) {
        apiData.observer = initObserver(onIntersect);
      }
    }
    gestureData.preTranslateZoomTarget = window.innerWidth < 600 ? 0.5 : 0.6
    gestureData.zoomTarget = window.innerWidth < 600 ? 0.5 : 0.6
    window.addEventListener("keyup", onKeyUp);
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("keyup", onKeyUp);
  gestureData.translating = false;
  if (apiData.observer) {
    apiData.observer.disconnect();
  }
});

onBeforeRouteUpdate(onIndexEnter);

onBeforeRouteLeave(
  onIndexLeave(() => {
    mouseData.showCursor = false;
  })
);
</script>
