import { loadApi } from "@/utils/api";
import { Project } from "@/utils/api.types";
import {
  createAllProjectsMediaWindows,
  createProjectWindows,
} from "@/utils/layout";
import {
  WindowData,
  ProjectMediaWindows,
  Vector2,
  Boundary
} from "@/utils/layout.types";
import { preloadImg } from "@/utils/visual";
import { computeZoomTarget, generateWindowSize } from "@/utils/layout";
import { defineStore } from "pinia";
import { useGestureData } from "@/stores/gestureData";

type Callback = (arg: any) => void;

const apiDataWorker = new Worker("/apiDataWorker.js");
const windowDataWorker = new Worker("/windowDataWorker.js");

export interface IntersectionEntry {
  isVisible: boolean;
  id: string;
}

export const useApiData = defineStore("apiData", {
  state: (): {
    projects: Project[];
    projectWindows: WindowData[];
    mediaWindows: ProjectMediaWindows[];
    projectWindowBounds: Boundary;
    loaded: boolean;
    imgsPreloaded: boolean;
    isMobile: boolean;
    baseWindowSize: Vector2;
    selectedId: string;
    loaderAnimationFinished: boolean;
    tutorialFinished: boolean;
    showTutorial: boolean;
    showLoader: boolean;
    loadingProgress: number;
    loadingMessage: string;
    zoomTarget: number;
    preTranslateZoomTarget: number;
    zoomFactor: number;
    windowVisibilities: IntersectionEntry[];
    outOfBounds: boolean;
    lastVisibleWindowId: string | null;
    observer: IntersectionObserver | null;
  } => ({
    projects: [],
    projectWindows: [],
    mediaWindows: [],
    windowVisibilities: [],
    loaded: false,
    imgsPreloaded: false,
    isMobile: window.innerWidth < 600,
    baseWindowSize: {
      x: window.innerWidth < 600 ? 300 : 500,
      y: window.innerWidth < 600 ? 300 : 500,
    },
    projectWindowBounds: {
      top: -window.innerHeight,
      left: -window.innerWidth,
      right: window.innerWidth,
      bottom: window.innerHeight,
    },
    selectedId: "0",
    loaderAnimationFinished: false,
    tutorialFinished: true,
    showTutorial: false,
    showLoader: true,
    loadingProgress: 0,
    loadingMessage: "Fetching exciting projects...",
    zoomTarget: window.innerWidth < 600 ? 0.8 : 0.6,
    preTranslateZoomTarget: window.innerWidth < 600 ? 0.8 : 0.6,
    zoomFactor: 1,
    outOfBounds: false,
    lastVisibleWindowId: null,
    observer: null,
  }),
  getters: {
    allWindows: (state) => [
      ...state.mediaWindows.map(({ mediaWindows }) => mediaWindows).flat(1),
      ...state.projectWindows,
    ],
    openWindow: (state): WindowData | undefined =>
      state.projectWindows.find((el) => el.open),
    isWindowOpen: (state): boolean =>
      state.projectWindows.some((el: WindowData) => el.open),
    selectedWindow(state): WindowData | undefined {
      return this.allWindows.find((el) => el.id === state.selectedId);
    },
    visibleOpenWindows(state): (WindowData)[] {
      const mediaWins = state.mediaWindows.find(
        ({ projectUid }) => projectUid === this.openWindow?.id
      );
      const windows = [ this.openWindow, ...(mediaWins?.mediaWindows || []) ].filter((window): window is WindowData => window !== undefined);
      return windows;
    },
    selectedVisibleOpenWindowIndex(): number {
      if(!this.selectedWindow) return -1;
      return this.visibleOpenWindows.indexOf(this.selectedWindow);
    },
    visibleWindows: (state) => state.windowVisibilities.filter(({ isVisible }) => isVisible)
  },
  actions: {
    async load(onSuccess?: Callback, onError?: Callback) {
      try {
        apiDataWorker.onmessage = (e) => {
          if (e.data?.projects) {
            this.projects = e.data.projects;
            this.selectedId = this.projects[0]?.uid || "0";
            this.loadingProgress = 25;
            this.loadingMessage = "Generating layout...";
            this.createLayout(onSuccess, onError);
          }
        };

        apiDataWorker.postMessage("load");
      } catch (e) {
        if (onError) onError(e);
      }
    },
    async createLayout(onSuccess?: Callback, onError?: Callback) {
      try {
        windowDataWorker.onmessage = async (e) => {
          if (e.data.projectWindows) {
            this.projectWindows = e.data.projectWindows;
            this.loadingMessage = "Placing images and mockups...";
          }
          if (e.data.mediaWindows) {
            this.mediaWindows = e.data.mediaWindows;
          }
          if(e.data.projectWindowBounds) {
            this.projectWindowBounds = e.data.projectWindowBounds as Boundary;
          }
          if (e.data.progress) {
            this.loadingProgress = e.data.progress;
            if (e.data.progress === 90) {
              this.loadingMessage = "Loading previews...";
              await this.preloadImages(onError);
              this.loadingMessage = "All done !";
              this.loaded = true;
              if (onSuccess) onSuccess(this.projects);
            }
          }
        };

        windowDataWorker.postMessage({
          baseWindowSize: JSON.stringify(this.baseWindowSize),
          projects: JSON.stringify(this.projects),
        });
      } catch (e) {
        if (onError) onError(e);
      }
    },
    async preloadImages(onError?: Callback) {
      try {
        const imgUrls = this.allWindows
          .map(({ thumbnail }) =>
            Object.entries(thumbnail)
              .filter(([ key, val ]) => key !== "original")
              .map(([ _, { url } ]) => url)
              .filter((url) => url !== undefined)
          )
          .flat(1);
        const preloaded = await Promise.all<Promise<boolean>[]>(
          imgUrls.map((url) => preloadImg(url))
        );
        const loaded = preloaded.every((bool) => bool);
        this.imgsPreloaded = loaded;
        this.loadingProgress = 100;

        return loaded;
      } catch (e) {
        if (onError) onError(e);
        return false;
      }
    },
    getWindowById(windowId: string | number): WindowData | undefined {
      return this.allWindows.find(({ id }) => id === windowId);
    },
    hideAllProjectMediaWindows() {
      this.mediaWindows
        .map(({ mediaWindows }) => mediaWindows)
        .flat(1)
        .forEach((window) => {
          window.hidden = true;
          window.selected = false;
        });
    },
    showAllProjectWindows() {
      this.projectWindows.forEach((window) => {
        window.hidden = false;
        window.open = false;
      });
    },
    setWindowSelection(selectedId: string) {
      this.allWindows.forEach((window) => {
        window.selected = window.id === selectedId;
      });
    },
    closeWindow(windowId?: string): void {
      this.hideAllProjectMediaWindows();
      if (windowId) {
        this.selectWindow(windowId, false, undefined, 0.5);
      }
      this.showAllProjectWindows();
    },
    selectWindow(
      targetId: string,
      forceShowCursor?: boolean,
      event?: MouseEvent,
      zt?: number,
      forceSelect?: boolean,
    ) {
      const gestureData = useGestureData();

      const window = this.getWindowById(targetId);
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (
        window &&
        (this.selectedId !== targetId || this.openWindow?.id === targetId || forceSelect) &&
        !window.hidden
      ) {
        console.log("translate to window", targetId)
        this.selectedId = targetId;
        gestureData.translating = true;

        this.setWindowSelection(targetId);

        const zoom =
          zt ||
          computeZoomTarget(
            generateWindowSize(
              window.thumbnail.original.aspectRatio,
              this.baseWindowSize
            ),
            this.isMobile ? 100 : 300
          );
        gestureData.zoomTarget = zoom;
        gestureData.preTranslateZoomTarget = zoom;
      }
    },
  },
});
