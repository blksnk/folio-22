import { loadApi } from "@/utils/api";
import { Project } from "@/utils/api.types";
import {
  createAllProjectsMediaWindows,
  createProjectWindows,
} from "@/utils/layout";
import { WindowData, ProjectMediaWindows, Vector2 } from "@/utils/layout.types";
import { preloadImg } from "@/utils/visual";
import { defineStore } from "pinia";

type Callback = (arg: any) => void;

const apiDataWorker = new Worker("/apiDataWorker.js");
const windowDataWorker = new Worker("/windowDataWorker.js");

export const useApiData = defineStore("apiData", {
  state: (): {
    projects: Project[];
    projectWindows: WindowData[];
    mediaWindows: ProjectMediaWindows[];
    loaded: boolean;
    imgsPreloaded: boolean;
    isMobile: boolean;
    baseWindowSize: Vector2;
    selectedId: string | number;
    loaderAnimationFinished: boolean;
    indexEnterFinished: boolean;
    loadingProgress: number;
  } => ({
    projects: [],
    projectWindows: [],
    mediaWindows: [],
    loaded: false,
    imgsPreloaded: false,
    isMobile: window.innerWidth < 600,
    baseWindowSize: {
      x: window.innerWidth < 600 ? 300 : 500,
      y: window.innerWidth < 600 ? 300 : 500,
    },
    selectedId: 0,
    loaderAnimationFinished: false,
    indexEnterFinished: false,
    loadingProgress: 0,
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
  },
  actions: {
    async load(
      baseWindowSize: Vector2,
      onSuccess?: Callback,
      onError?: Callback
    ) {
      try {
        apiDataWorker.onmessage = (e) => {
          console.log(e);
          if (e.data?.projects) {
            this.projects = e.data.projects;
            this.selectedId = this.projects[0]?.uid || 0;
            this.loadingProgress = 25;
            windowDataWorker.postMessage({
              baseWindowSize: JSON.stringify(baseWindowSize),
              projects: JSON.stringify(e.data.projects),
            });
          }
        };
        windowDataWorker.onmessage = async (e) => {
          console.log(e.data);
          if (e.data.projectWindows) {
            this.projectWindows = e.data.projectWindows;
          }
          if (e.data.mediaWindows) {
            this.mediaWindows = e.data.mediaWindows;
          }
          if (e.data.progress) {
            this.loadingProgress = e.data.progress;
            if (e.data.progress === 90) {
              await this.preloadImages(onError);
              this.loaded = true;
              if (onSuccess) onSuccess(this.projects);
            }
          }
        };

        apiDataWorker.postMessage("load");
        // const res = await loadApi();
        // if (res?.projects) {
        //   this.projects = res.projects;
        //   this.selectedId = this.projects[0]?.uid || 0;
        //   this.projectWindows = createProjectWindows(
        //     res.projects,
        //     baseWindowSize
        //   );
        //   this.mediaWindows = createAllProjectsMediaWindows(
        //     res.projects,
        //     this.projectWindows,
        //     baseWindowSize
        //   );
        //   await this.preloadImages(onError);
        //   this.loaded = true;

        //   if (onSuccess) onSuccess(res.projects);
        // } else throw new Error("Empty response");
      } catch (e) {
        if (onError) onError(e);
      }
    },
    async preloadImages(onError?: Callback) {
      try {
        const imgUrls = this.allWindows
          .map(({ thumbnail }) =>
            Object.values(thumbnail)
              .map(({ url }) => url)
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
  },
});
