import { loadApi } from "@/utils/api";
import { Project } from "@/utils/api.types";
import {
  createAllProjectsMediaWindows,
  createProjectWindows,
} from "@/utils/layout";
import { WindowData, ProjectMediaWindows, Vector2 } from "@/utils/layout.types";
import { defineStore } from "pinia";

type Callback = (arg: any) => void;

export const useApiData = defineStore("apiData", {
  state: (): {
    projects: Project[];
    projectWindows: WindowData[];
    mediaWindows: ProjectMediaWindows[];
    loaded: boolean;
    isMobile: boolean;
    baseWindowSize: Vector2;
  } => ({
    projects: [],
    projectWindows: [],
    mediaWindows: [],
    loaded: false,
    isMobile: window.innerWidth < 600,
    baseWindowSize: {
      x: window.innerWidth < 600 ? 250 : 500,
      y: window.innerWidth < 600 ? 250 : 500,
    },
  }),
  getters: {
    allWindows: (state) => [
      ...state.mediaWindows.map(({ mediaWindows }) => mediaWindows).flat(1),
      ...state.projectWindows,
    ],
  },
  actions: {
    async load(
      baseWindowSize: Vector2,
      onSuccess?: Callback,
      onError?: Callback
    ) {
      try {
        const res = await loadApi();
        if (res?.projects) {
          console.log(res);
          this.projects = res.projects;
          this.projectWindows = createProjectWindows(
            res.projects,
            baseWindowSize
          );
          this.mediaWindows = createAllProjectsMediaWindows(
            res.projects,
            this.projectWindows,
            baseWindowSize
          );
          this.loaded = true;

          if (onSuccess) onSuccess(res.projects);
        } else throw new Error("Empty response");
      } catch (e) {
        if (onError) onError(e);
      }
    },
  },
});
